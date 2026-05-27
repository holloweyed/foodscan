# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt
import datetime
import hashlib
import re

from app.db.database import get_db
from app.config import get_settings

router = APIRouter()
settings = get_settings()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


@router.post("/register")
async def register(
    email: str,
    username: str,
    password: str,
    db: AsyncSession = Depends(get_db),
):
    from app.db.models import User
    from sqlalchemy import select

    # Проверка email
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        raise HTTPException(400, "Некорректный формат email")

    # Проверка пароля
    if len(password) < 6:
        raise HTTPException(400, "Пароль должен быть не менее 6 символов")
    
    if not re.search(r'[a-zA-Zа-яА-ЯёЁ]', password) or not re.search(r'[0-9]', password):
        raise HTTPException(400, "Пароль должен содержать и буквы, и цифры")

    # Проверка имени пользователя
    if len(username) < 3:
        raise HTTPException(400, "Логин должен быть не менее 3 символов")
    
    if not username.isalnum():
        raise HTTPException(400, "Логин должен содержать только буквы и цифры")

    # Проверка, существует ли пользователь
    existing = await db.execute(select(User).where(User.username == username))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Пользователь с таким логином уже существует")

    # Проверка, занят ли email
    existing_email = await db.execute(select(User).where(User.email == email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(400, "Этот email уже используется")

    hashed = hash_password(password)
    user = User(email=email, username=username, password_hash=hashed)
    db.add(user)
    await db.commit()

    token = jwt.encode(
        {
            "sub": user.id,
            "username": user.username,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        settings.SECRET_KEY,
    )

    return {
        "access_token": token,
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }


@router.post("/login")
async def login(
    username: str,
    password: str,
    db: AsyncSession = Depends(get_db),
):
    from app.db.models import User
    from sqlalchemy import select

    if not username or not password:
        raise HTTPException(400, "Введите логин и пароль")

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(401, "Неверный логин или пароль")

    token = jwt.encode(
        {
            "sub": user.id,
            "username": user.username,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        settings.SECRET_KEY,
    )

    return {
        "access_token": token,
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }


@router.delete("/delete")
async def delete_account(
    username: str,
    password: str,
    db: AsyncSession = Depends(get_db),
):
    from app.db.models import User
    from sqlalchemy import select

    if not password:
        raise HTTPException(400, "Введите пароль для подтверждения")

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(401, "Неверный пароль")

    await db.delete(user)
    await db.commit()

    return {"message": "Аккаунт успешно удалён"}