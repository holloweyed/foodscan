# backend/app/services/cache_service.py
import json
import pickle
from typing import Optional, Any, Dict
from datetime import timedelta
import redis.asyncio as redis
from loguru import logger

from app.config import get_settings


class CacheService:
    
    def __init__(self):
        settings = get_settings()
        
        self.redis_client = None
        self.redis_url = settings.redis_url
        self.ttl_ocr = settings.CACHE_TTL_OCR
        self.ttl_additive = settings.CACHE_TTL_ADDITIVE
        self.local_cache: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self):
        """Подключение к Redis"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await self.redis_client.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Using local cache.")
            self.redis_client = None
    
    async def disconnect(self):
        """Отключение от Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Disconnected from Redis")
    
    async def get_ocr_cache(self, image_hash: str) -> Optional[str]:
        cache_key = f"ocr:{image_hash}"

        if self.redis_client:
            try:
                cached = await self.redis_client.get(cache_key)
                if cached:
                    logger.debug(f"Redis cache hit for OCR: {image_hash[:16]}")
                    return cached
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
        
        if cache_key in self.local_cache:
            logger.debug(f"Local cache hit for OCR: {image_hash[:16]}")
            return self.local_cache[cache_key]["data"]
        
        return None
    
    async def set_ocr_cache(self, image_hash: str, text: str):
        cache_key = f"ocr:{image_hash}"
        ttl = self.ttl_ocr
        
        if self.redis_client:
            try:
                await self.redis_client.setex(cache_key, ttl, text)
                logger.debug(f"Cached OCR result in Redis: {image_hash[:16]}")
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")

        self.local_cache[cache_key] = {
            "data": text,
            "expires_at": None,
        }
    
    async def get_analysis_cache(self, image_hash: str) -> Optional[Dict]:

        cache_key = f"analysis:{image_hash}"
        
        if self.redis_client:
            try:
                cached = await self.redis_client.get(cache_key)
                if cached:
                    logger.debug(f"Redis cache hit for analysis: {image_hash[:16]}")
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
        
        if cache_key in self.local_cache:
            logger.debug(f"Local cache hit for analysis: {image_hash[:16]}")
            return self.local_cache[cache_key]["data"]
        
        return None
    
    async def set_analysis_cache(self, image_hash: str, result: Dict):

        cache_key = f"analysis:{image_hash}"
        ttl = self.ttl_ocr
        
        if self.redis_client:
            try:
                data = json.dumps(result, ensure_ascii=False)
                await self.redis_client.setex(cache_key, ttl, data)
                logger.debug(f"Cached analysis result in Redis: {image_hash[:16]}")
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")
        
        self.local_cache[cache_key] = {
            "data": result,
            "expires_at": None,
        }
    
    async def get_additive_cache(self, e_code: str) -> Optional[Dict]:
        cache_key = f"additive:{e_code}"
        
        if self.redis_client:
            try:
                cached = await self.redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception:
                pass
        
        if cache_key in self.local_cache:
            return self.local_cache[cache_key]["data"]
        
        return None
    
    async def set_additive_cache(self, e_code: str, data: Dict):
        """Кэширует информацию о добавке"""
        cache_key = f"additive:{e_code}"
        ttl = self.ttl_additive
        
        if self.redis_client:
            try:
                await self.redis_client.setex(
                    cache_key, ttl, json.dumps(data, ensure_ascii=False)
                )
                return
            except Exception:
                pass
        
        self.local_cache[cache_key] = {
            "data": data,
            "expires_at": None,
        }
    
    async def clear_all(self):
        """Очищает весь кэш"""
        self.local_cache.clear()
        if self.redis_client:
            try:
                await self.redis_client.flushdb()
                logger.info("Redis cache cleared")
            except Exception as e:
                logger.warning(f"Failed to clear Redis cache: {e}")
    
    def get_stats(self) -> Dict:
        """Возвращает статистику кэша"""
        return {
            "local_cache_size": len(self.local_cache),
            "redis_connected": self.redis_client is not None,
        }
