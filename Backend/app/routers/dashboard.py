from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from ..dependencies import get_db, get_current_user
from ..db import models
from ..core import crud
from datetime import datetime, timedelta
import re

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Get Top 3 Active Items (most audit logs)
    # Filter for ITEM entity logs
    top_items_query = db.query(
        models.AuditLog.entity_id,
        func.count(models.AuditLog.id).label('count')
    ).filter(
        models.AuditLog.entity_type == "ITEM"
    ).group_by(
        models.AuditLog.entity_id
    ).order_by(
        func.count(models.AuditLog.id).desc()
    ).limit(3).all()
    
    top_item_ids = [item.entity_id for item in top_items_query]
    
    # 2. Reconstruct History for these items
    # We want to show quantity trends.
    # Current strategy: 
    # - Get current quantity
    # - Get all UPDATE logs for quantity
    # - Reconstruct backwards
    
    stats = []
    
    for item_id in top_item_ids:
        item = crud.get_item(db, item_id)
        if not item:
            continue
            
        # Get all logs for this item regarding quantity updates
        logs = db.query(models.AuditLog).filter(
            models.AuditLog.entity_type == "ITEM",
            models.AuditLog.entity_id == item_id,
            models.AuditLog.action == "UPDATE",
            models.AuditLog.details.like("Updated quantity to%")
        ).order_by(models.AuditLog.timestamp.desc()).all()
        
        # Build timeline
        # Start with current
        history = []
        current_qty = item.quantity
        
        # Add current state point
        history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "quantity": current_qty
        })
        
        simulated_qty = current_qty
        
        for log in logs:
            # Parse log details: "Updated quantity to {new_qty}"
            # This log represents the state AFTER the update.
            # So at log.timestamp, quantity BECAME new_qty.
            # Before this log, quantity was something else.
            # Wait, if we have "Updated quantity to 5", and next log (older) says "Updated quantity to 10".
            # Time T1: Qty 5 (Log says to 5)
            # Time T0: Qty 10 (Log says to 10)
            # So the graph points are (T1, 5), (T0, 10).
            # But what about before T0? We don't know the initial state unless we find a CREATE log.
            # For this simple chart, we'll just plot these points.
            
            match = re.search(r"Updated quantity to (\d+)", log.details)
            if match:
                qty = int(match.group(1))
                history.append({
                    "timestamp": log.timestamp.isoformat(),
                    "quantity": qty
                })
        
        # Sort history by timestamp ascending for the chart
        history.sort(key=lambda x: x['timestamp'])
        
        stats.append({
            "item_id": item.id,
            "title": item.title,
            "current_quantity": item.quantity,
            "history": history
        })
        
    # 3. General Stats (Cards)
    total_low_stock = db.query(models.Item).filter(models.Item.quantity < 10, models.Item.quantity > 0).count()
    total_out_of_stock = db.query(models.Item).filter(models.Item.quantity == 0).count()
    total_items = db.query(models.Item).count()
    active_alerts = db.query(models.Alert).filter(models.Alert.status == models.AlertStatus.ACTIVE).count()
        
    return {
        "item_stats": stats,
        "summary": {
            "total_items": total_items,
            "low_stock": total_low_stock,
            "out_of_stock": total_out_of_stock,
            "active_alerts": active_alerts
        }
    }
