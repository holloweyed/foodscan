# backend/app/core/ocr/postprocessor.py
import re
from typing import List


class TextPostProcessor:
    
    def __init__(self):
        self.ocr_fixes = {
            "диоксид": ["диок сид", "диокс ид", "диокси д"],
            "консервант": ["консер вант", "кон сервант", "консерва нт"],
            "краситель": ["крас итель", "к рас итель", "краси тель"],
            "ароматизатор": ["аромат изатор", "арома тизатор"],
            "стабилизатор": ["стаб илизатор", "ста били затор"],
            "эмульгатор": ["эмул ьгатор", "эмул ьга тор"],
            "антиокислитель": ["анти окис литель", "антиокис литель"],
            "подсластитель": ["под сластитель", "подслас титель"],
            "загуститель": ["загу ститель", "за гус титель"],
            "глазирователь": ["глаз ирователь", "глазиро ватель"],
            "регулятор": ["регу лятор", "ре гулятор", "регуля тор"],
        }
        
        self.chemical_endings = [
            "ат", "ит", "ид", "ин", "ан", "ен", "ол",
            "оза", "аза", "нат", "калий", "кальций",
            "магний", "натрий", "аммоний",
        ]
        
        self.composition_markers = [
            "состав:", "состав ", "ингредиенты:", "ингредиенты ",
            "содержит:", "компоненты:",
        ]
    
    def process(self, text: str) -> str:
        if not text:
            return ""

        text = self._clean_whitespace(text)
        text = self._fix_broken_words(text)
        text = self._normalize_e_codes(text)
        text = self._remove_artifacts(text)
        
        return text
    
    def _clean_whitespace(self, text: str) -> str:
        text = re.sub(r"\s+", " ", text)
        text = text.strip()
        return text
    
    def _fix_broken_words(self, text: str) -> str:
        for correct, errors in self.ocr_fixes.items():
            for error in errors:
                if error in text:
                    text = text.replace(error, correct)
        
        pattern = (
            r"(\w{3,})\s+(\w{2,}(?:" + "|".join(self.chemical_endings) + r"))"
        )
        
        def try_merge(match):
            word1, word2 = match.groups()
            merged = word1 + word2
            if len(merged) > len(word1) and len(merged) > len(word2):
                return merged
            return match.group(0)
        
        return re.sub(pattern, try_merge, text)
    
    def _normalize_e_codes(self, text: str) -> str:
        text = re.sub(r"E\s+(\d)", r"E\1", text)
        text = re.sub(r"(?:Е|Е)(\d{3,4})", r"E\1", text)
        text = re.sub(r"E-(\d)", r"E\1", text)
        return text
    
    def _remove_artifacts(self, text: str) -> str:
        text = re.sub(r"(.)\1{10,}", "", text)
        text = re.sub(r"[^\w\s]{5,}", "", text)
        return text
    
    def extract_composition_text(self, text: str) -> str:
        text_lower = text.lower()
        
        for marker in self.composition_markers:
            marker_lower = marker.lower()
            idx = text_lower.find(marker_lower)
            
            if idx >= 0:
                composition_start = idx + len(marker)
                remaining = text[composition_start:]
                
                end_markers = ["\n\n", "  ", "пищевая ценность", "энергетическая ценность"]
                end_idx = len(remaining)
                
                for end_marker in end_markers:
                    pos = remaining.lower().find(end_marker.lower())
                    if pos > 0 and pos < end_idx:
                        end_idx = pos
                
                composition = remaining[:end_idx].strip()
                if len(composition) > 10:
                    return composition
        
        return text
    
    def extract_e_codes(self, text: str) -> List[str]:
        patterns = [
            r"E\d{3,4}[a-f]?",
            r"E\s*\d{3,4}[a-f]?",
            r"E-\d{3,4}[a-f]?",
        ]
        
        found = set()
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                code = re.sub(r"[^E\dA-F]", "", match.upper())
                if re.match(r"^E[1-9]\d{2,3}[A-F]?$", code):
                    found.add(code)
        
        return sorted(list(found))
    
    def extract_allergens(self, text: str) -> List[str]:
        allergen_keywords = [
            "глютен", "лактоза", "орехи", "арахис", "соя",
            "яйца", "молоко", "рыба", "моллюски", "сельдерей",
            "горчица", "кунжут", "люпин", "диоксид серы",
        ]
        
        text_lower = text.lower()
        found = []
        
        for allergen in allergen_keywords:
            if allergen in text_lower:
                found.append(allergen)
        
        return found