# backend/app/db/crud.py
from app.db.models import Additive, User, ScanHistory, DetectedAdditive
from typing import List, Optional, Dict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Additive


class AdditiveRepository:
    """Репозиторий для работы с таблицей e_additives"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_ecode(self, e_code: str) -> Optional[Additive]:
        """Получить добавку по E-коду"""
        query = select(Additive).where(Additive.e_code == e_code.upper())
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_ecodes(self, e_codes: List[str]) -> List[Additive]:
        """Получить несколько добавок по списку E-кодов"""
        upper_codes = [code.upper() for code in e_codes]
        query = select(Additive).where(Additive.e_code.in_(upper_codes))
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def search_by_name(self, name: str, limit: int = 10) -> List[Additive]:
        """Поиск добавок по названию"""
        query = (
            select(Additive)
            .where(func.lower(Additive.name_ru) == func.lower(name))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def search_by_name_fuzzy(self, name: str, limit: int = 5) -> List[Additive]:
        """Нечеткий поиск добавок"""
        query = (
            select(Additive)
            .where(Additive.name_ru.ilike(f"%{name}%"))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_all_danger_levels(self) -> Dict[str, int]:
        """Статистика по уровням опасности"""
        query = (
            select(Additive.danger_level, func.count(Additive.id))
            .group_by(Additive.danger_level)
        )
        result = await self.db.execute(query)
        return {row[0]: row[1] for row in result.fetchall()}
    
    async def get_all(self) -> List[Additive]:
        query = select(Additive)
        result = await self.db.execute(query)
        return list(result.scalars().all())

class UserRepository:
    """Репозиторий для работы с пользователями"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, email: str, username: str, password_hash: str) -> User:
        user = User(email=email, username=username, password_hash=password_hash)
        self.db.add(user)
        await self.db.flush()
        return user
    
    async def get_by_username(self, username: str) -> Optional[User]:
        query = select(User).where(User.username == username)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


class ScanHistoryRepository:
    """Репозиторий для истории сканирований"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def save_scan(
        self,
        user_id: int,
        image_hash: str,
        scanned_text: str,
        additives_found: int,
        scan_duration_ms: int,
        detected_additives_data: List[Dict] = None,
    ) -> ScanHistory:
        scan = ScanHistory(
            user_id=user_id,
            image_hash=image_hash,
            scanned_text=scanned_text,
            additives_found=additives_found,
            scan_duration_ms=scan_duration_ms,
        )
        self.db.add(scan)
        await self.db.flush()
        
        if detected_additives_data:
            for add_data in detected_additives_data:
                detected = DetectedAdditive(
                    scan_id=scan.id,
                    e_code=add_data.get("e_code", ""),
                    name_ru=add_data.get("name_ru", ""),
                    danger_level=add_data.get("danger_level", ""),
                    category=add_data.get("category", ""),
                )
                self.db.add(detected)
        
        return scan
    
    async def get_user_history(self, user_id: int, limit: int = 20) -> List[ScanHistory]:
        query = (
            select(ScanHistory)
            .where(ScanHistory.user_id == user_id)
            .order_by(ScanHistory.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()