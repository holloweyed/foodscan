# backend/app/core/analyzer/ecode_detector.py
import re
from typing import List, Dict, Optional
from loguru import logger


class ECodeDetector:
    """
    Специализированный детектор E-кодов пищевых добавок.
    
    Использует регулярные выражения и эвристики для поиска
    E-кодов в распознанном тексте.
    """
    
    def __init__(self):
        # Основные паттерны E-кодов
        self.e_code_patterns = [
            r'\bE[1-9]\d{2,3}[a-fA-F]?\b',         # E100-E1599 с буквами
            r'\bE[-—–\s]*\d{3,4}[a-fA-F]?\b',      # E-100, E 100
            r'\b[ЕE][ЗЗ3]\d{2,3}\b',                # Частые ошибки: E300-E399
            r'\b[ЕE][16]\d{2}\b',                    # E100-E199, E600-E699
            r'\b\d{3,4}\s*\(E\d{3,4}\)\b',          # 123 (E123)
            r'\bE\d{3}\s*[a-fA-F]\b',               # Буквенный суффикс
        ]
        
        # Словарь типичных OCR-ошибок при распознавании E-кодов
        self.ocr_corrections = {
            'E1O0': 'E100', 'E1O1': 'E101', 'E1O2': 'E102',
            'E1O3': 'E103', 'E1O4': 'E104', 'E1O5': 'E105',
            'EЗ00': 'E300', 'EЗ01': 'E301', 'EЗ02': 'E302',
            'EЗ03': 'E303', 'EЗ04': 'E304', 'EЗ05': 'E305',
            'Eб00': 'E600', 'Eб01': 'E601', 'Eб02': 'E602',
            'El00': 'E100', 'El01': 'E101', 'El02': 'E102',
            'EI00': 'E100', 'EI01': 'E101', 'EI02': 'E102',
            'E2З0': 'E230', 'E2З1': 'E231', 'E2З2': 'E232',
        }
        
        # Диапазоны валидных E-кодов
        self.valid_ranges = [
            (100, 199),   # Красители
            (200, 299),   # Консерванты
            (300, 399),   # Антиокислители
            (400, 499),   # Стабилизаторы, загустители
            (500, 599),   # Регуляторы кислотности
            (600, 699),   # Усилители вкуса
            (700, 799),   # Антибиотики
            (900, 999),   # Глазирователи, подсластители
            (1000, 1599), # Дополнительные добавки
        ]
    
    def detect(self, text: str) -> List[str]:
        """
        Обнаружение E-кодов в тексте.
        
        Args:
            text: Распознанный текст этикетки
            
        Returns:
            Список нормализованных E-кодов без дубликатов
        """
        if not text:
            return []
        
        found_codes = set()
        
        # Подготавливаем текст
        text_upper = text.upper()
        text_no_spaces = text_upper.replace(' ', '').replace('-', '').replace('—', '')
        
        # Применяем все паттерны
        for pattern in self.e_code_patterns:
            matches = re.finditer(pattern, text_no_spaces, re.IGNORECASE)
            for match in matches:
                raw_code = match.group(0)
                cleaned = self._clean_and_validate(raw_code)
                if cleaned:
                    found_codes.add(cleaned)
        
        # Если ничего не нашли через паттерны, пробуем найти в исходном тексте
        if not found_codes:
            found_codes = self._extract_from_raw_text(text)
        
        result = sorted(list(found_codes))
        logger.debug(f"Detected E-codes: {result}")
        
        return result
    
    def _clean_and_validate(self, code: str) -> Optional[str]:
        """
        Очистка и валидация E-кода.
        
        Args:
            code: Сырой код из регулярного выражения
            
        Returns:
            Валидированный E-код или None
        """
        # Удаляем не-алфавитно-цифровые символы
        code = re.sub(r'[^A-Z0-9]', '', code.upper())
        
        # Проверяем словарь коррекции
        if code in self.ocr_corrections:
            code = self.ocr_corrections[code]
        
        # Проверяем базовый формат: E + цифры + опциональная буква
        match = re.match(r'^(E)(\d{3,4})([A-F]?)$', code)
        if not match:
            return None
        
        prefix, number, suffix = match.groups()
        number_int = int(number)
        
        # Проверяем, что номер входит в допустимый диапазон
        if not self._is_valid_number(number_int):
            return None
        
        # Формируем нормализованный код
        if suffix:
            return f"{prefix}{number}{suffix.lower()}"
        return f"{prefix}{number}"
    
    def _is_valid_number(self, number: int) -> bool:
        """Проверяет, входит ли номер в допустимые диапазоны E-кодов"""
        for min_val, max_val in self.valid_ranges:
            if min_val <= number <= max_val:
                return True
        return False
    
    def _extract_from_raw_text(self, text: str) -> set:
        """
        Дополнительное извлечение E-кодов из сырого текста.
        Используется когда основные паттерны не сработали.
        """
        found = set()
        
        # Ищем последовательности, похожие на E-коды
        potential = re.findall(r'[EЕ]\s*\d{3,4}', text, re.IGNORECASE)
        
        for match in potential:
            # Очищаем и проверяем
            cleaned = re.sub(r'[^E0-9]', '', match.upper())
            if re.match(r'^E\d{3,4}$', cleaned):
                number = int(cleaned[1:])
                if self._is_valid_number(number):
                    found.add(cleaned)
        
        return found
    
    def get_ecode_category(self, e_code: str) -> Optional[str]:
        """
        Определяет категорию добавки по номеру E-кода.
        
        Args:
            e_code: Нормализованный E-код (например, 'E100')
            
        Returns:
            Категория добавки или None
        """
        match = re.match(r'^E(\d{3,4})', e_code.upper())
        if not match:
            return None
        
        number = int(match.group(1))
        
        categories = {
            (100, 199): "Красители",
            (200, 299): "Консерванты",
            (300, 399): "Антиокислители",
            (400, 499): "Стабилизаторы, загустители, эмульгаторы",
            (500, 599): "Регуляторы кислотности, разрыхлители",
            (600, 699): "Усилители вкуса и аромата",
            (700, 799): "Антибиотики",
            (900, 999): "Глазирователи, подсластители",
            (1000, 1099): "Ферментные препараты",
            (1100, 1599): "Прочие добавки",
        }
        
        for (min_val, max_val), category in categories.items():
            if min_val <= number <= max_val:
                return category
        
        return "Прочие добавки"