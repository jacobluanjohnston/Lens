from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models import Incident
from datetime import datetime

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.get("/")
def get_incidents(
    city: str = Query(..., description="sf or chicago"),
    start_date: datetime = Query(..., description="Start of date range"),
    end_date: datetime = Query(..., description="End of date range"),
    category: str = Query(None, description="Crime type filter (optional)"),
    db: Session = Depends(get_db)
):
    query = select(Incident).where(
        Incident.city == city,
        Incident.incident_date >= start_date,
        Incident.incident_date <= end_date,
    )
    if category:
        query = query.where(Incident.category == category)

    results = db.execute(query).scalars().all()

    return [
        {
            "id": str(r.id),
            "city": r.city,
            "incident_date": r.incident_date,
            "category": r.category,
            "description": r.description,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "neighborhood": r.neighborhood,
        }
        for r in results
    ]