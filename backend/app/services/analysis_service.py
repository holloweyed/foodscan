# backend/app/services/analysis_service.py
import hashlib
import time
from typing import Dict, Any, Optional, List
import numpy as np
from loguru import logger

from app.core.scanner import FoodAdditivesScanner
from app.db.crud import AdditiveRepository, ScanHistoryRepository
from app.services.cache_service import CacheService


class AnalysisService:
    """
    Сервис анализа этикеток.
    
    Оркестрирует полный процесс анализа, включая
    OCR, поиск в БД и сохранение истории.
    """
    
    def __init__(
        self,
        scanner: FoodAdditivesScanner,
        additive_repo: Optional[AdditiveRepository] = None,
        scan_history_repo: Optional[ScanHistoryRepository] = None,
        cache_service: Optional[CacheService] = None,
    ):
        self.scanner = scanner
        self.additive_repo = additive_repo
        self.scan_history_repo = scan_history_repo
        self.cache_service = cache_service
    
    async def analyze(
        self,
        image: np.ndarray,
        user_id: Optional[int] = None,
        return_raw_text: bool = False,
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        """
        Выполняет полный анализ изображения этикетки.
        
        Args:
            image: Изображение в формате numpy array (BGR)
            user_id: ID пользователя (для сохранения истории)
            return_raw_text: Вернуть ли распознанный текст
            use_cache: Использовать ли кэш результатов
            
        Returns:
            Словарь с результатами анализа
        """
        start_time = time.time()
        
        # Вычисляем хэш изображения для кэширования
        image_hash = hashlib.sha256(image.tobytes()).hexdigest()
        
        # Проверяем кэш
        if use_cache and self.cache_service:
            cached_result = await self.cache_service.get_analysis_cache(image_hash)
            if cached_result:
                logger.info(f"Returning cached result for image {image_hash[:16]}")
                return cached_result
        
        # Запускаем OCR и базовый анализ
        result = await self.scanner.analyze_product_composition(
            image,
            return_raw_text=return_raw_text,
        )
        
        if "error" in result:
            return result
        
        # Если есть доступ к БД, обогащаем результат
        if self.additive_repo:
            result = await self._enrich_with_db_data(result)
        
        # Сохраняем в историю
        if user_id and self.scan_history_repo:
            try:
                await self._save_to_history(
                    user_id=user_id,
                    image_hash=image_hash,
                    result=result,
                )
            except Exception as e:
                logger.warning(f"Failed to save scan history: {e}")
        
        # Кэшируем результат
        if self.cache_service:
            await self.cache_service.set_analysis_cache(image_hash, result)
        
        # Добавляем метрики
        total_duration = int((time.time() - start_time) * 1000)
        result["total_duration_ms"] = total_duration
        
        return result
    
    async def _enrich_with_db_data(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обогащает результат данными из БД.
        
        Args:
            result: Базовый результат анализа
            
        Returns:
            Обогащенный результат
        """
        e_codes = result.get("e_codes_found", [])
        
        if not e_codes:
            return result
        
        try:
            # Получаем информацию из БД
            db_additives = await self.additive_repo.get_by_ecodes(e_codes)
            
            # Обновляем информацию о добавках
            enriched_additives = self.scanner._prepare_additives_info(
                e_codes,
                db_additives,
            )
            
            # Обновляем результат
            result["additives"] = enriched_additives
            result["total_additives_found"] = len(enriched_additives)
            result["safety_summary"] = self.scanner._compute_safety_summary(
                enriched_additives
            )
            
            logger.debug(f"Enriched result with DB data for {len(db_additives)} additives")
            
        except Exception as e:
            logger.warning(f"Failed to enrich result with DB data: {e}")
        
        return result
    
    async def _save_to_history(
        self,
        user_id: int,
        image_hash: str,
        result: Dict[str, Any],
    ):
        """
        Сохраняет результат анализа в историю пользователя.
        
        Args:
            user_id: ID пользователя
            image_hash: Хэш изображения
            result: Результат анализа
        """
        additives_data = []
        for add in result.get("additives", []):
            additives_data.append({
                "e_code": add.get("e_code", ""),
                "name_ru": add.get("name_ru", ""),
                "danger_level": add.get("danger_level", ""),
                "category": add.get("category", ""),
            })
        
        await self.scan_history_repo.save_scan(
            user_id=user_id,
            image_hash=image_hash,
            scanned_text=result.get("raw_text", ""),
            additives_found=result.get("total_additives_found", 0),
            scan_duration_ms=result.get("scan_duration_ms", 0),
            detected_additives_data=additives_data,
        )
        
        logger.debug(f"Saved scan to history for user {user_id}")