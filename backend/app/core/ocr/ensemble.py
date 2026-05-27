# backend/app/core/ocr/ensemble.py
import asyncio
import hashlib
from typing import List
from collections import Counter

import cv2
import numpy as np
import easyocr
import pytesseract
from loguru import logger


class EnsembleOCR:
    
    def __init__(self, languages: str = "ru,en", gpu: bool = False):
        self.languages = languages.split(",")
        
        logger.info(f"Initializing EasyOCR with languages: {self.languages}")
        self.easy_reader = easyocr.Reader(self.languages, gpu=gpu)
        
        self.tesseract_configs = [
            {
                "name": "default",
                "config": f'--oem 3 --psm 6 -l {"+".join(self.languages)}',
            },
            {
                "name": "sparse_text",
                "config": f'--oem 3 --psm 11 -l {"+".join(self.languages)}',
            },
            {
                "name": "single_block",
                "config": f'--oem 1 --psm 3 -l {"+".join(self.languages)}',
            },
        ]
        
        self.cache: dict = {}
        
        logger.info("EnsembleOCR initialized successfully")
    
    def _get_image_hash(self, image: np.ndarray) -> str:
        image_bytes = image.tobytes()
        return hashlib.sha256(image_bytes).hexdigest()
    
    async def recognize(self, image: np.ndarray) -> str:
        image_hash = self._get_image_hash(image)
        if image_hash in self.cache:
            logger.debug("Returning cached OCR result")
            return self.cache[image_hash]
        
        results = await asyncio.gather(
            self._run_easyocr(image),
            self._run_tesseract(image, self.tesseract_configs[0]),
            self._run_tesseract(image, self.tesseract_configs[1]),
            self._run_tesseract(image, self.tesseract_configs[2]),
            return_exceptions=True,
        )
        
        valid_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.warning(f"OCR engine {i} failed: {result}")
                continue
            if result:
                valid_results.append(result)
        
        if not valid_results:
            logger.error("All OCR engines failed")
            return ""
        
        final_text = self._vote_on_words(valid_results)
        self.cache[image_hash] = final_text
        
        return final_text
    
    async def _run_easyocr(self, image: np.ndarray) -> str:
        loop = asyncio.get_event_loop()
        
        def _recognize():
            try:
                results = self.easy_reader.readtext(
                    image,
                    detail=0,
                    paragraph=True,
                    text_threshold=0.6,
                )
                return " ".join(results)
            except Exception as e:
                logger.error(f"EasyOCR error: {e}")
                return ""
        
        return await loop.run_in_executor(None, _recognize)
    
    async def _run_tesseract(self, image: np.ndarray, config: dict) -> str:
        loop = asyncio.get_event_loop()
        
        def _recognize():
            try:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                text = pytesseract.image_to_string(
                    rgb_image,
                    config=config["config"],
                )
                return text.strip()
            except Exception as e:
                logger.error(f"Tesseract ({config['name']}) error: {e}")
                return ""
        
        return await loop.run_in_executor(None, _recognize)
    
    def _vote_on_words(self, texts: List[str], threshold: float = 0.5) -> str:
        all_words_lists = []
        for text in texts:
            words = text.split()
            all_words_lists.append(words)
        
        word_counter = Counter()
        for words in all_words_lists:
            word_counter.update(set(words))
        
        min_votes = max(2, int(len(texts) * threshold))
        
        longest_text = max(texts, key=len)
        final_words = []
        
        for word in longest_text.split():
            if word_counter[word] >= min_votes:
                final_words.append(word)
        
        return " ".join(final_words)
    
    def clear_cache(self):
        self.cache.clear()
        logger.info("OCR cache cleared")
    
    def get_cache_stats(self) -> dict:
        return {
            "cached_items": len(self.cache),
            "cache_size_bytes": sum(
                len(text.encode("utf-8")) for text in self.cache.values()
            ),
        }