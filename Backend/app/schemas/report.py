from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

class ReportStats(BaseModel):
    total_items: int
    total_inventory_value: float
    low_stock_count: int

class CategoryBreakdown(BaseModel):
    category: str
    item_count: int
    value: float

class AuditLogMixin(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    user_id: Optional[int] = None
    timestamp: datetime
    details: Optional[str] = None
    
    class Config:
        from_attributes = True

class MonthlyReport(BaseModel):
    report_date: datetime
    month: int
    year: int
    stats: ReportStats
    category_breakdown: List[CategoryBreakdown]
    activities: List[AuditLogMixin]

    class Config:
        from_attributes = True
