# backend/app/core/analyzer/fuzzy_search.py
from typing import List, Dict, Tuple
from loguru import logger

from rapidfuzz import fuzz, process

from app.core.analyzer.ocr_metric import OCRWeightedMetric


class FuzzySearch:

    def __init__(self, use_custom_metric: bool = True, similarity_threshold: float = 0.75):
        """
        Args:
            use_custom_metric: True — своя метрика, False — rapidfuzz
            similarity_threshold: Порог схожести
        """
        self.use_custom = use_custom_metric
        self.threshold = similarity_threshold
        
        if use_custom_metric:
            self.metric = OCRWeightedMetric()
            logger.info("FuzzySearch initialized with OCRWeightedMetric")
        else:
            logger.info("FuzzySearch initialized with rapidfuzz")
        
        # Химические префиксы и суффиксы (общие для обоих методов)
        self.chemical_prefixes = [
            "ди", "три", "тетра", "пента", "гекса", "поли",
            "моно", "орто", "мета", "пара", "изо", "цикло",
        ]
        
        self.chemical_suffixes = [
            "ид", "ит", "ат", "ан", "ен", "ин", "ол", "ил",
            "оза", "аза", "иновая", "овая", "ая",
        ]
    
    def search_by_name(
        self,
        query: str,
        candidates: List[Dict[str, str]],
        min_score: float = 80,
        limit: int = 5,
    ) -> List[Dict]:
        """
        Нечеткий поиск названия среди кандидатов.
        
        Args:
            query: Искомое название
            candidates: Список [{"name_ru": "...", "e_code": "..."}]
            min_score: Минимальный score (0-100)
            limit: Максимум результатов
            
        Returns:
            Отсортированный список совпадений
        """
        if not candidates or not query:
            return []
        
        if self.use_custom:
            return self._search_with_custom_metric(query, candidates, min_score, limit)
        else:
            return self._search_with_rapidfuzz(query, candidates, min_score, limit)
    
    def _search_with_custom_metric(
        self, query: str, candidates: List[Dict], min_score: float, limit: int
    ) -> List[Dict]:
        """Поиск с собственной OCR-адаптированной метрикой"""
        matches = []
        
        for candidate in candidates:
            name = candidate.get('name_ru', '')
            if not name:
                continue
            
            score = self.metric.compare(query, name)
            if score >= min_score:
                candidate_copy = candidate.copy()
                candidate_copy['match_score'] = score
                matches.append(candidate_copy)
        
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        logger.debug(f"Custom metric search for '{query}': found {len(matches[:limit])} matches")
        
        return matches[:limit]
    
    def _search_with_rapidfuzz(
        self, query: str, candidates: List[Dict], min_score: float, limit: int
    ) -> List[Dict]:
        """Поиск через rapidfuzz"""
        query_clean = self._normalize_chemical_name(query)
        candidate_names = [c.get("name_ru", "") for c in candidates]
        
        results = process.extract(
            query_clean,
            candidate_names,
            scorer=fuzz.token_sort_ratio,
            limit=limit,
            score_cutoff=min_score,
        )
        
        matches = []
        for name, score, index in results:
            if score >= min_score:
                candidate = candidates[index].copy()
                candidate["match_score"] = score
                matches.append(candidate)
        
        logger.debug(f"Rapidfuzz search for '{query}': found {len(matches)} matches")
        return matches
    
    def search_similar_names(
        self,
        name: str,
        known_names: List[str],
        threshold: float = 0.8,
    ) -> List[Tuple[str, float]]:
        """Поиск похожих названий среди известных (старый метод)"""
        name_normalized = self._normalize_chemical_name(name)
        similar = []
        
        for known in known_names:
            known_normalized = self._normalize_chemical_name(known)
            ratio = fuzz.token_sort_ratio(name_normalized, known_normalized) / 100.0
            
            if ratio >= threshold:
                similar.append((known, ratio))
        
        similar.sort(key=lambda x: x[1], reverse=True)
        return similar[:10]
    
    def _normalize_chemical_name(self, name: str) -> str:
        """Нормализация химического названия"""
        if not name:
            return ""
        
        name = name.lower().strip()
        name = " ".join(name.split())
        name = self._remove_parentheses(name)
        name = self._normalize_numeric_prefixes(name)
        
        return name
    
    def _remove_parentheses(self, text: str) -> str:
        """Удаляет скобки и их содержимое"""
        import re
        return re.sub(r'\([^)]*\)', '', text).strip()
    
    def _normalize_numeric_prefixes(self, text: str) -> str:
        """Заменяет числовые префиксы на текстовые"""
        replacements = {
            "2-": "ди", "3-": "три", "4-": "тетра", "5-": "пента", "6-": "гекса",
        }
        for numeric, text_prefix in replacements.items():
            if text.startswith(numeric):
                text = text_prefix + text[len(numeric):]
        return text
    
    def extract_chemical_names(self, text: str) -> List[str]:
        """Извлекает потенциальные химические названия из текста"""
        import re
        
        found_names = []
        patterns = [
            r'\b([а-яёa-z]+\s+[а-яёa-z]+(?:а|я|о|ий|ый|ой)?)\b',
            r'\b([а-яёa-z]{4,}(?:' + '|'.join(self.chemical_suffixes) + r'))\b',
            r'(?:E\d{3}[a-z]?)\s+([А-ЯЁA-Z][а-яёa-z]+\s+[А-ЯЁA-Z][а-яёa-z]+)',
        ]
        
        stop_words = {
            'состав', 'продукт', 'пищевой', 'добавка', 'вещество',
            'ингредиент', 'компонент', 'содержит', 'могут', 'может',
            'вызывать', 'продукты', 'питания', 'изготовитель', 'дата',
            'годен', 'хранить', 'упаковке', 'масса', 'нетто', 'брутто',
        }
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                name = match[0] if isinstance(match, tuple) else match
                name = name.strip().lower()
                
                if len(name) < 4 or name in stop_words:
                    continue
                if re.search(r'[eе]\d{3}', name):
                    continue
                
                found_names.append(name)
        
        return list(set(found_names))