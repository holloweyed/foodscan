# backend/app/db/schemas.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, validator


class AdditiveBase(BaseModel):
    e_code: str = Field(..., min_length=3, max_length=10, pattern=r'^E\d{3,4}[a-f]?$')
    name_ru: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., max_length=100)
    danger_level: str = Field(..., max_length=50)
    description: str
    allowed_in_rus: bool = True


class AdditiveCreate(AdditiveBase):
    name_en: Optional[str] = None
    allowed_in_eu: bool = True
    daily_dose: Optional[str] = None
    side_effects: Optional[str] = None
    sources: Optional[str] = None


class AdditiveResponse(AdditiveBase):
    id: int
    name_en: Optional[str] = None
    daily_dose: Optional[str] = None
    side_effects: Optional[str] = None
    
    class Config:
        from_attributes = True


class AdditiveAnalysisResult(BaseModel):
    """Результат анализа одной добавки для ответа API"""
    e_code: str
    name_ru: str
    category: str
    danger_level: str
    description: str
    recommendation: str
    allowed_in_rus: bool
    risk_icon: str
    
    class Config:
        from_attributes = True


class AnalysisRequest(BaseModel):
    """Запрос на анализ изображения"""
    return_raw_text: bool = False
    include_descriptions: bool = True
    language: str = "ru"


class AnalysisResult(BaseModel):
    """Полный результат анализа этикетки"""
    request_id: str
    total_additives_found: int
    additives: List[AdditiveAnalysisResult]
    raw_text: Optional[str] = None
    safety_summary: dict
    scan_duration_ms: Optional[int] = None
    
    class Config:
        from_attributes = True


class AnalysisError(BaseModel):
    """Ответ при ошибке анализа"""
    error: str
    message: str
    request_id: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_premium: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class ScanHistoryItem(BaseModel):
    id: int
    image_thumbnail: Optional[str] = None
    additives_found: int
    scan_duration_ms: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScanHistoryDetail(ScanHistoryItem):
    scanned_text: Optional[str] = None
    detected_additives: List[AdditiveAnalysisResult] = []
    
    class Config:
        from_attributes = True


class ScanHistoryResponse(BaseModel):
    total: int
    items: List[ScanHistoryItem]
    page: int
    page_size: int


class HealthCheck(BaseModel):
    status: str
    version: str
    database: str
    redis: str
    ocr_engine: str
    uptime_seconds: float


class MetricsResponse(BaseModel):
    total_scans: int
    total_users: int
    average_scan_time_ms: float
    popular_additives: List[dict]
