from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime
from ..db import models
from ..dependencies import get_db, get_current_active_user
from ..schemas import report as report_schema

router = APIRouter()

@router.get("/monthly", response_model=report_schema.MonthlyReport)
async def get_monthly_report(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Generate a monthly inventory report.
    Only accessible by users with 'admin' role.
    """
    if current_user.role != models.Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access reports"
        )

    import traceback
    try:
        # Default to current month/year if not provided
        now = datetime.utcnow()
        if month is None:
            month = now.month
        if year is None:
            year = now.year

        # 1. Inventory Stats (Snapshot of current state)
        items = db.query(models.Item).all()
        
        total_items = 0
        total_value = 0.0
        low_stock_count = 0
        
        category_map = {}

        for item in items:
            # Global Stats
            total_items += item.quantity
            item_value = item.quantity * item.price
            total_value += item_value
            
            if item.quantity < 10: # Assuming 10 is low stock threshold
                low_stock_count += 1
                
            # Category Breakdown
            cat = item.category or "Uncategorized"
            if cat not in category_map:
                category_map[cat] = {"count": 0, "value": 0.0}
            
            category_map[cat]["count"] += item.quantity
            category_map[cat]["value"] += item_value

        stats = report_schema.ReportStats(
            total_items=total_items,
            total_inventory_value=total_value,
            low_stock_count=low_stock_count
        )

        category_breakdown = [
            report_schema.CategoryBreakdown(
                category=cat,
                item_count=data["count"],
                value=data["value"]
            ) for cat, data in category_map.items()
        ]

        # 2. Activity Summary (Audit Logs for the month)
        # Filter audit logs by month and year
        audit_logs = db.query(models.AuditLog).filter(
            extract('month', models.AuditLog.timestamp) == month,
            extract('year', models.AuditLog.timestamp) == year
        ).order_by(models.AuditLog.timestamp.desc()).all()
        
        # Explicitly validate to catch errors
        activities_data = []
        for log in audit_logs:
            try:
                activities_data.append(report_schema.AuditLogMixin.model_validate(log))
            except Exception as log_err:
                # Get more details from the log object for debugging
                log_details = {
                    "id": getattr(log, 'id', 'unknown'),
                    "action": getattr(log, 'action', 'unknown'),
                    "timestamp": getattr(log, 'timestamp', 'unknown')
                }
                print(f"FAILED TO SERIALIZE LOG: {log_details} - ERROR: {log_err}")
                continue

        return report_schema.MonthlyReport(
            report_date=now,
            month=month,
            year=year,
            stats=stats,
            category_breakdown=category_breakdown,
            activities=activities_data
        )
    except Exception as e:
        print(f"ERROR GENERATING REPORT: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
