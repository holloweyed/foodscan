# backend/app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import analyze, additives, auth

api_router = APIRouter()

api_router.include_router(analyze.router, prefix="/analyze", tags=["analysis"])
api_router.include_router(additives.router, prefix="/additives", tags=["additives"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])