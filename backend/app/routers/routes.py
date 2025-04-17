from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/routes",
    tags=["routes"],
)

@router.get("", response_model=List[schemas.Route])
def get_routes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    """
    Lấy danh sách các tuyến đường.
    """
    routes = db.query(models.Route).offset(skip).limit(limit).all()
    return routes