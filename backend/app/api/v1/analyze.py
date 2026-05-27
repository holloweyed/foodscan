# backend/app/api/v1/analyze.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import cv2
import numpy as np
import asyncio
from loguru import logger

from app.db.database import get_db
from app.api.deps import get_additive_repository
from app.db.crud import AdditiveRepository
from app.core.analyzer.fuzzy_search import FuzzySearch
from app.core.ocr.preprocessor import ImagePreprocessor
from app.core.ocr.postprocessor import TextPostProcessor

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp"}

preprocessor = ImagePreprocessor(max_size=2000)
postprocessor = TextPostProcessor()
fuzzy = FuzzySearch()

import easyocr
reader = easyocr.Reader(['ru', 'en'], gpu=False)

RECOMMENDATIONS = {
    "Безопасен": "Можно употреблять",
    "Умеренно опасен": "Ограничить потребление",
    "Опасен": "Рекомендуется избегать",
    "Запрещен": "Запрещено в РФ",
}


def ocr_image_sync(image: np.ndarray) -> str:
    """Синхронное распознавание текста через EasyOCR"""
    results = reader.readtext(image, detail=0, paragraph=True)
    return " ".join(results)


async def ocr_image(image: np.ndarray) -> str:
    """Асинхронная обёртка над синхронным EasyOCR"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, ocr_image_sync, image)


async def process_single_pass(
    image: np.ndarray,
    additive_repo: AdditiveRepository,
    pass_name: str,
) -> tuple:
    
    raw_text = await ocr_image(image)
    raw_text = postprocessor.process(raw_text)
    logger.info(f"{pass_name}: {raw_text[:200]}...")
    
    e_codes = await extract_e_codes_from_text(raw_text, additive_repo)
    logger.info(f"{pass_name}: found {len(e_codes)} codes: {e_codes}")
    
    return e_codes, raw_text


async def extract_e_codes_from_text(raw_text: str, additive_repo: AdditiveRepository) -> list:
    import re
    from rapidfuzz import process as rp_process, fuzz as rp_fuzz
    
    cleaned_text = postprocessor.process(raw_text)
    
    e_codes = postprocessor.extract_e_codes(cleaned_text)
    logger.debug(f"Regex E-codes: {e_codes}")
    
    try:
        all_additives = await additive_repo.get_all()
        
        text_clean = cleaned_text
        for keyword in ['антиокислитель', 'антиоксилитель', 'стабилизатор', 'консервант',
                        'краситель', 'эмульгатор', 'загуститель', 'подсластитель',
                        'глазирователь', 'регулятор']:
            text_clean = text_clean.replace(keyword, ' ' + keyword)
        text_clean = text_clean.replace('-', ' ').replace('.', ' ').replace(',', ' ')
        
        text_lower = text_clean.lower()
        
        # Точный поиск
        for additive in all_additives:
            if additive.name_ru and additive.name_ru.lower() in text_lower:
                if additive.e_code not in e_codes:
                    e_codes.append(additive.e_code)
                    logger.debug(f"Exact match: {additive.name_ru} -> {additive.e_code}")
        
        # Нечёткий поиск
        additive_names = [{"name_ru": a.name_ru, "e_code": a.e_code} for a in all_additives if a.name_ru]
        words = text_lower.split()
        
        text_fragments = []
        for i in range(len(words) - 1):
            text_fragments.append(" ".join(words[i:i+2]))
        for i in range(len(words) - 2):
            text_fragments.append(" ".join(words[i:i+3]))
        
        for fragment in text_fragments[:200]:
            if len(fragment.replace(' ', '')) < 8:
                continue
            
            results = rp_process.extract(
                fragment,
                [a["name_ru"] for a in additive_names],
                scorer=rp_fuzz.token_sort_ratio,
                limit=1,
                score_cutoff=70,
            )
            for name, score, idx in results:
                if score >= 70:
                    code = additive_names[idx]["e_code"]
                    if code not in e_codes:
                        e_codes.append(code)
    except Exception as e:
        logger.warning(f"Search failed: {e}")
    
    return list(set(e_codes))


async def build_result(e_codes: list, additive_repo: AdditiveRepository, raw_text: str = "") -> dict:
    additives = []
    for code in e_codes:
        try:
            db_additive = await additive_repo.get_by_ecode(code)
            if db_additive:
                additives.append({
                    "e_code": db_additive.e_code,
                    "name_ru": db_additive.name_ru,
                    "category": db_additive.category,
                    "danger_level": db_additive.danger_level,
                    "description": db_additive.description or "",
                    "recommendation": RECOMMENDATIONS.get(db_additive.danger_level, "Изучить"),
                    "allowed_in_rus": db_additive.allowed_in_rus,
                    "risk_icon": "warning",
                })
            else:
                additives.append({
                    "e_code": code,
                    "name_ru": "Неизвестная добавка",
                    "category": "Неизвестно",
                    "danger_level": "Неизвестно",
                    "description": "",
                    "recommendation": "Проверить",
                    "allowed_in_rus": True,
                    "risk_icon": "warning",
                })
        except Exception as e:
            logger.warning(f"DB lookup failed for {code}: {e}")

    safe_count = sum(1 for a in additives if a['danger_level'] == 'Безопасен')
    moderate_count = sum(1 for a in additives if a['danger_level'] == 'Умеренно опасен')
    dangerous_count = sum(1 for a in additives if a['danger_level'] == 'Опасен')
    banned_count = sum(1 for a in additives if a['danger_level'] == 'Запрещен')

    result = {
        "request_id": "ok",
        "total_additives_found": len(additives),
        "additives": additives,
        "safety_summary": {
            "overall_safety": "Анализ завершен",
            "safe_count": safe_count,
            "moderate_count": moderate_count,
            "dangerous_count": dangerous_count,
            "banned_count": banned_count,
            "has_warnings": dangerous_count > 0 or banned_count > 0,
        },
    }
    
    if raw_text:
        result["raw_text"] = raw_text[:500]
    
    return result


@router.post("/label")
async def analyze_label(
    file: UploadFile = File(...),
    return_raw_text: bool = Query(False),
    additive_repo: AdditiveRepository = Depends(get_additive_repository),
):
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(413, detail="File too large")
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(415, detail="Unsupported format")

    try:
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(400, detail="Failed to decode image")

        logger.info(f"Analyzing image: {file.filename}, size: {image.shape}")

        processed_image = preprocessor.process(image)
        
        raw_task = process_single_pass(image, additive_repo, "Pass 1 (raw)")
        processed_task = process_single_pass(processed_image, additive_repo, "Pass 2 (processed)")
        
        (e_codes_raw, raw_text), (e_codes_processed, processed_text) = await asyncio.gather(
            raw_task, processed_task
        )

        if len(e_codes_processed) > len(e_codes_raw):
            final_e_codes = e_codes_processed
            final_text = processed_text
            ocr_method = "processed"
            logger.info("Using PROCESSED image (better results)")
        elif len(e_codes_raw) > len(e_codes_processed):
            final_e_codes = e_codes_raw
            final_text = raw_text
            ocr_method = "raw"
            logger.info("Using RAW image (better results)")
        else:
            final_e_codes = list(set(e_codes_raw + e_codes_processed))
            final_text = raw_text if len(raw_text) > len(processed_text) else processed_text
            ocr_method = "merged"
            logger.info("Merging both results")

        logger.info(f"Final E-codes ({ocr_method}): {final_e_codes}")

        if not final_e_codes and not raw_text and not processed_text:
            return {
                "request_id": "empty",
                "total_additives_found": 0,
                "additives": [],
                "safety_summary": {
                    "overall_safety": "Текст не найден",
                    "safe_count": 0, "moderate_count": 0,
                    "dangerous_count": 0, "banned_count": 0,
                    "has_warnings": False,
                },
            }

        result = await build_result(final_e_codes, additive_repo, final_text)
        result["ocr_method"] = ocr_method

        return result

    except Exception as e:
        logger.exception(f"Error: {e}")
        raise HTTPException(500, detail=str(e))


@router.get("/status")
async def get_analysis_status():
    return {
        "status": "operational",
        "ocr_engine": "EasyOCR (ru, en) — parallel dual-pass",
        "preprocessing": "Adaptive (CLAHE + Inpaint + Bilateral)",
        "postprocessing": "TextPostProcessor enabled",
        "fuzzy_search": "WRatio (score_cutoff=75)",
    }