# backend/app/api/v1/history.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.db.database import get_db
from app.db.crud import ScanHistoryRepository
from app.db.schemas import (
    ScanHistoryResponse,
    ScanHistoryDetail,
)
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter()


@router.get("/", response_model=ScanHistoryResponse)
async def get_scan_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить историю сканирований пользователя.
    
    Возвращает пагинированный список предыдущих анализов.
    """
    repo = ScanHistoryRepository(db)
    
    items, total = await repo.get_user_history(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
    )
    
    history_items = []
    for item in items:
        history_items.append({
            "id": item.id,
            "image_thumbnail": item.image_thumbnail,
            "additives_found": item.additives_found,
            "scan_duration_ms": item.scan_duration_ms,
            "created_at": item.created_at,
        })
    
    return ScanHistoryResponse(
        total=total,
        items=history_items,
        page=page,
        page_size=page_size,
    )


@router.get("/{scan_id}", response_model=ScanHistoryDetail)
async def get_scan_detail(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить детальную информацию о конкретном сканировании.
    """
    repo = ScanHistoryRepository(db)
    scan = await repo.get_scan_detail(scan_id, current_user.id)
    
    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )
    
    detected_additives = []
    for da in scan.detected_additives:
        detected_additives.append({
            "e_code": da.e_code,
            "name_ru": da.name_ru or "",
            "danger_level": da.danger_level or "",
            "category": da.category or "",
        })
    
    return ScanHistoryDetail(
        id=scan.id,
        image_thumbnail=scan.image_thumbnail,
        additives_found=scan.additives_found,
        scan_duration_ms=scan.scan_duration_ms,
        created_at=scan.created_at,
        scanned_text=scan.scanned_text,
        detected_additives=detected_additives,
    )


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Удалить запись из истории сканирований.
    """
    repo = ScanHistoryRepository(db)
    scan = await repo.get_scan_detail(scan_id, current_user.id)
    
    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )
    
    await repo.delete_scan(scan_id)
    
    logger.info(f"User {current_user.id} deleted scan {scan_id}")
    
    return {"message": "Scan deleted successfully"}


@router.get("/stats/summary")
async def get_scan_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить статистику сканирований пользователя.
    """
    repo = ScanHistoryRepository(db)
    stats = await repo.get_scan_stats(current_user.id)
    
    return stats
