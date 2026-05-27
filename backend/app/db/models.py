# backend/app/db/models.py
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Additive(Base):
    __tablename__ = "e_additives"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    e_code = Column(String(10), unique=True, nullable=False)
    name_ru = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    danger_level = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    allowed_in_rus = Column(Boolean, default=True)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    
    scan_history = relationship("ScanHistory", back_populates="user")


class ScanHistory(Base):
    __tablename__ = "scan_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_hash = Column(String(64))
    image_thumbnail = Column(Text)
    scanned_text = Column(Text)
    additives_found = Column(Integer, default=0)
    scan_duration_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="scan_history")
    detected_additives = relationship("DetectedAdditive", back_populates="scan")


class DetectedAdditive(Base):
    __tablename__ = "detected_additives"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey("scan_history.id", ondelete="CASCADE"), nullable=False)
    e_code = Column(String(10), nullable=False)
    name_ru = Column(String(200))
    danger_level = Column(String(50))
    category = Column(String(100))
    
    scan = relationship("ScanHistory", back_populates="detected_additives")


class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    warn_on_moderate = Column(Boolean, default=True)
    warn_on_dangerous = Column(Boolean, default=True)
    hide_safe_additives = Column(Boolean, default=False)
    language = Column(String(10), default='ru')
    dark_mode = Column(Boolean, default=False)
    allergies = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())