from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from db import get_db
import mysql.connector

router = APIRouter(prefix="/stock", tags=["Stock"])

class StockCheckRequest(BaseModel):
    PID: str
    Quantity: int

class StockCheckResponse(BaseModel):
    PID: str
    Available: int
    Requested: int
    Sufficient: bool

class StockCheckItem(BaseModel):
    PID: str
    Quantity: int

class StockCheckMultipleRequest(BaseModel):
    items: List[StockCheckItem]

@router.post("/check")
def check_stock(request: StockCheckRequest):
    """Check if sufficient stock is available for a product"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT COALESCE(SUM(Stock), 0) as TotalStock
            FROM Lists
            WHERE PID = %s
        """, (request.PID,))
        result = cursor.fetchone()
        
        available = result["TotalStock"] if result else 0
        sufficient = available >= request.Quantity

        return {
            "PID": request.PID,
            "Available": available,
            "Requested": request.Quantity,
            "Sufficient": sufficient
        }

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.post("/check-multiple")
def check_stock_multiple(request: StockCheckMultipleRequest):
    """Check stock for multiple products at once"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        results = []
        insufficient_items = []

        for item in request.items:
            cursor.execute("""
                SELECT COALESCE(SUM(Stock), 0) as TotalStock
                FROM Lists
                WHERE PID = %s
            """, (item.PID,))
            result = cursor.fetchone()
            
            available = result["TotalStock"] if result else 0
            requested = item.Quantity
            sufficient = available >= requested

            results.append({
                "PID": item.PID,
                "Available": available,
                "Requested": requested,
                "Sufficient": sufficient
            })

            if not sufficient:
                insufficient_items.append({
                    "PID": item.PID,
                    "RequestedQuantity": requested,
                    "AvailableStock": available
                })

        return {
            "all_sufficient": len(insufficient_items) == 0,
            "items": results,
            "insufficient_items": insufficient_items
        }

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

