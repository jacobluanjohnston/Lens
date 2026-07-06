from sqlalchemy import Column, String, Float, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city = Column(String, nullable=False)           # "sf" or "chicago"
    incident_date = Column(DateTime, nullable=False) # when it happened
    category = Column(String, nullable=True)         # crime type e.g. "THEFT"
    description = Column(String, nullable=True)      # more detail
    latitude = Column(Float, nullable=True)          # for map plotting
    longitude = Column(Float, nullable=True)         # for map plotting
    neighborhood = Column(String, nullable=True)     # e.g. "Mission"
    is_officer_initiated = Column(Boolean, nullable=True)  # proactive vs reactive
    was_resolved = Column(Boolean, nullable=True)    # for resolution-adjusted lens
    raw_data = Column(String, nullable=True)         # original row as JSON string