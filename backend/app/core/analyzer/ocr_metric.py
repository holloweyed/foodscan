# backend/app/core/analyzer/ocr_metric.py

class OCRWeightedMetric:
    
    _WEIGHTS = {
        ('а', 'о'): 0.3, ('о', 'а'): 0.3,
        ('е', 'с'): 0.4, ('с', 'е'): 0.4,
        ('и', 'н'): 0.3, ('н', 'и'): 0.3,
        ('п', 'л'): 0.4, ('л', 'п'): 0.4,
        ('ш', 'щ'): 0.3, ('щ', 'ш'): 0.3,
        ('ь', 'ъ'): 0.2, ('ъ', 'ь'): 0.2,
    }
    
    def compare(self, text1: str, text2: str) -> float:
        """
        Сравнивает две строки с учётом OCR-ошибок.
        Возвращает оценку от 0 до 100.
        """
        if not text1 or not text2:
            return 0.0
        
        t1 = text1.lower().strip()
        t2 = text2.lower().strip()
        
        # 1. Точное совпадение
        if t1 == t2:
            return 100.0
        
        # 2. Совпадение без пробелов
        if t1.replace(' ', '') == t2.replace(' ', ''):
            return 95.0
        
        # Собираем оценки от разных методов
        scores = []
        
        # 3. Взвешенный Левенштейн (основной метод)
        scores.append(self._levenshtein_score(t1, t2))
        
        # 4. Частичное совпадение
        scores.append(self._partial_score(t1, t2))
        
        # 5. Пословное сравнение
        scores.append(self._token_score(t1, t2))
        
        return max(scores)
    
    def _levenshtein_score(self, s1: str, s2: str) -> float:
        s1 = s1.replace(' ', '')
        s2 = s2.replace(' ', '')
        
        if not s1 or not s2:
            return 0.0
        
        m, n = len(s1), len(s2)
        dp = [[0.0] * (n + 1) for _ in range(m + 1)]
        
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if s1[i-1] == s2[j-1]:
                    cost = 0.0
                else:
                    cost = self._WEIGHTS.get((s1[i-1], s2[j-1]), 1.0)
                
                dp[i][j] = min(
                    dp[i-1][j] + 1.0,
                    dp[i][j-1] + 1.0,
                    dp[i-1][j-1] + cost,
                )
        
        max_len = max(m, n)
        return max(0.0, (1.0 - dp[m][n] / max_len) * 100)
    
    def _partial_score(self, shorter: str, longer: str) -> float:
        shorter = shorter.replace(' ', '')
        longer = longer.replace(' ', '')
        
        if len(shorter) > len(longer):
            shorter, longer = longer, shorter
        
        if len(shorter) < 3:
            return 0.0

        if shorter in longer:
            return 85.0 + (len(shorter) / len(longer)) * 10.0

        best = 0.0
        for i in range(len(longer) - len(shorter) + 1):
            window = longer[i:i+len(shorter)]
            score = self._levenshtein_score(shorter, window)
            best = max(best, score)
        
        return best * 0.9
    
    def _token_score(self, text1: str, text2: str) -> float:
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        common = words1 & words2
        only1 = words1 - words2
        only2 = words2 - words1
        
        total_score = len(common) * 100.0
        
        for w1 in only1:
            for w2 in only2:
                score = self._levenshtein_score(w1, w2)
                if score > 70:
                    total_score += score
        
        all_words = len(words1 | words2)
        return min(100.0, total_score / all_words)