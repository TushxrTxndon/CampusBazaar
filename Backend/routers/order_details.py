from fastapi import APIRouter, HTTPException
from models.order_details import OrderDetailCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/order-details", tags=["Order Details"])

@router.post("/add")
def add_order_detail(od: OrderDetailCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Order_Details (OrderID, PID, Order_Qty)
            VALUES (%s, %s, %s)
        """, (od.OrderID, od.PID, od.Order_Qty))

        conn.commit()
        return {"message": "Order item added"}

    except mysql.connector.Error as err:
        error_msg = str(err)
        # Extract meaningful error message from MySQL error
        if "45000" in error_msg or "Insufficient stock" in error_msg:
            raise HTTPException(400, "Insufficient stock for this product. Please check availability.")
        elif "Product not found in seller List" in error_msg:
            raise HTTPException(400, "Product is not available from any seller.")
        else:
            raise HTTPException(400, error_msg)

    finally:
        cursor.close()
        conn.close()
