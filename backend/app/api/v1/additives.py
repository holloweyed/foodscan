# backend/app/api/v1/additives.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.db.database import get_db
from app.db.crud import AdditiveRepository
from app.api.deps import get_additive_repository

router = APIRouter()

RECOMMENDATIONS = {
    "Безопасен": "Можно употреблять",
    "Умеренно опасен": "Ограничить потребление",
    "Опасен": "Рекомендуется избегать",
    "Запрещен": "Запрещено в РФ",
}


@router.get("/{e_code}")
async def get_additive(
    e_code: str,
    additive_repo: AdditiveRepository = Depends(get_additive_repository),
):
    """
    Получить информацию о пищевой добавке по E-коду.
    """
    additive = await additive_repo.get_by_ecode(e_code.upper())
    
    if not additive:
        raise HTTPException(
            status_code=404,
            detail=f"Additive with code {e_code} not found",
        )
    
    return {
        "e_code": additive.e_code,
        "name_ru": additive.name_ru,
        "category": additive.category,
        "danger_level": additive.danger_level,
        "description": additive.description,
        "allowed_in_rus": additive.allowed_in_rus,
        "recommendation": RECOMMENDATIONS.get(additive.danger_level, "Изучить"),
    }


@router.get("/search/")
async def search_additives(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    additive_repo: AdditiveRepository = Depends(get_additive_repository),
):
    """
    Поиск добавок по названию или E-коду.
    """
    import re
    
    # Проверяем, является ли запрос E-кодом
    if re.match(r'^E\d{3,4}[a-f]?$', q, re.IGNORECASE):
        additive = await additive_repo.get_by_ecode(q.upper())
        if additive:
            return [{
                "e_code": additive.e_code,
                "name_ru": additive.name_ru,
                "category": additive.category,
                "danger_level": additive.danger_level,
                "description": additive.description,
                "allowed_in_rus": additive.allowed_in_rus,
                "recommendation": RECOMMENDATIONS.get(additive.danger_level, "Изучить"),
            }]
        return []
    
    # Поиск по названию
    results = await additive_repo.search_by_name_fuzzy(q, limit=limit)
    
    return [
        {
            "e_code": a.e_code,
            "name_ru": a.name_ru,
            "category": a.category,
            "danger_level": a.danger_level,
            "description": a.description,
            "allowed_in_rus": a.allowed_in_rus,
            "recommendation": RECOMMENDATIONS.get(a.danger_level, "Изучить"),
        }
        for a in results
    ]


@router.get("/stats/summary")
async def get_additives_summary(
    additive_repo: AdditiveRepository = Depends(get_additive_repository),
):
    """Получить сводную статистику по добавкам"""
    danger_levels = await additive_repo.get_all_danger_levels()
    
    return {
        "total_additives": sum(danger_levels.values()),
        "by_danger_level": danger_levels,
    }

@router.get("/download/all")
async def download_all_additives(
    additive_repo: AdditiveRepository = Depends(get_additive_repository),
):
    """Скачать все добавки для офлайн-режима"""
    all_additives = await additive_repo.get_all()
    
    return [
        {
            "e_code": a.e_code,
            "name_ru": a.name_ru,
            "category": a.category,
            "danger_level": a.danger_level,
            "description": a.description or "",
            "allowed_in_rus": a.allowed_in_rus,
            "recommendation": RECOMMENDATIONS.get(a.danger_level, "Изучить"),
        }
        for a in all_additives
    ]