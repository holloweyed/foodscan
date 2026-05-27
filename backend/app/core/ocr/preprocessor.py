# backend/app/core/ocr/preprocessor.py
from typing import Tuple
import cv2
import numpy as np
from loguru import logger


class ImagePreprocessor:

    def __init__(self, max_size: int = 2000):
        self.max_size = max_size
    
    def process(self, image: np.ndarray) -> np.ndarray:
        try:
            image = self._resize_if_needed(image)
            label_type = self._classify_label_type(image)
            logger.debug(f"Label type: {label_type}")
            
            if label_type == "glossy":
                result = self._pipeline_glossy(image)
            elif label_type == "low_contrast":
                result = self._pipeline_low_contrast(image)
            elif label_type == "noisy":
                result = self._pipeline_noisy(image)
            else:
                result = self._pipeline_default(image)
            
            if len(result.shape) == 2:
                result = cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
            
            return result
        except Exception as e:
            logger.warning(f"Preprocessing failed: {e}")
            return image
    
    def _resize_if_needed(self, image: np.ndarray) -> np.ndarray:
        h, w = image.shape[:2]
        if max(h, w) > self.max_size:
            scale = self.max_size / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return image
    
    def _classify_label_type(self, image: np.ndarray) -> str:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        if np.sum(gray > 240) / gray.size > 0.05:
            return "glossy"
        
        if np.std(gray) < 30:
            return "low_contrast"
        
        if cv2.Laplacian(gray, cv2.CV_64F).var() > 500:
            return "noisy"
        
        return "default"
    
    def _pipeline_default(self, image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        enhanced = self._clahe(gray, clip=1.5, tile=16)
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    def _pipeline_glossy(self, image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
        
        if np.sum(mask > 0) / mask.size < 0.02:
            logger.debug("Few glares, skipping inpaint")
            enhanced = self._clahe(gray, clip=1.5, tile=16)
            return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.dilate(mask, kernel, iterations=1)
        inpainted = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)
        
        gray = cv2.cvtColor(inpainted, cv2.COLOR_BGR2GRAY)
        enhanced = self._clahe(gray, clip=1.5, tile=16)
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    def _pipeline_low_contrast(self, image: np.ndarray) -> np.ndarray:
        """Усиление контраста: растягивание + CLAHE"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        lo, hi = np.percentile(gray, (5, 95))
        stretched = np.clip((gray.astype(float) - lo) * 255.0 / (hi - lo), 0, 255).astype(np.uint8)
        
        enhanced = self._clahe(stretched, clip=2.0, tile=12)
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    def _pipeline_noisy(self, image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        denoised = cv2.bilateralFilter(gray, 5, 50, 50)
        
        enhanced = self._clahe(denoised, clip=1.5, tile=16)
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
    
    def _clahe(self, gray: np.ndarray, clip: float = 2.0, tile: int = 8) -> np.ndarray:
        """CLAHE — адаптивная эквализация гистограммы"""
        clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(tile, tile))
        return clahe.apply(gray)