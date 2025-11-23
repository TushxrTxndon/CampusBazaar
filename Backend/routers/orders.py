from fastapi import APIRouter, HTTPException
from models.orders import OrderCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/create")
def create_order(order: OrderCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Orders (OrderDate, EmailID)
            VALUES (%s, %s)
        """, (order.OrderDate, order.EmailID))

        conn.commit()
        return {"message": "Order created", "OrderID": cursor.lastrowid}

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))

    finally:
        cursor.close()
        conn.close()

@router.get("/user/{email_id}")
def get_user_orders(email_id: str):
    """Get all orders for a specific user with order details"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get all orders for the user
        cursor.execute("""
            SELECT OrderID, OrderDate, EmailID
            FROM Orders
            WHERE EmailID = %s
            ORDER BY OrderDate DESC, OrderID DESC
        """, (email_id,))
        orders = cursor.fetchall()

        # Get order details for each order
        for order in orders:
            cursor.execute("""
                SELECT od.PID, od.Order_Qty, p.ProductName, p.Description, p.Price
                FROM Order_Details od
                INNER JOIN Products p ON od.PID = p.PID
                WHERE od.OrderID = %s
            """, (order["OrderID"],))
            order_items = cursor.fetchall()
            
            # Calculate total for each order
            total = sum(item["Price"] * item["Order_Qty"] for item in order_items)
            order["Items"] = order_items
            order["Total"] = total

        return orders

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.get("/{order_id}")
def get_order(order_id: int):
    """Get a specific order with details"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT OrderID, OrderDate, EmailID
            FROM Orders
            WHERE OrderID = %s
        """, (order_id,))
        order = cursor.fetchone()

        if not order:
            raise HTTPException(404, "Order not found")

        cursor.execute("""
            SELECT od.PID, od.Order_Qty, p.ProductName, p.Description, p.Price
            FROM Order_Details od
            INNER JOIN Products p ON od.PID = p.PID
            WHERE od.OrderID = %s
        """, (order_id,))
        order_items = cursor.fetchall()
        
        total = sum(item["Price"] * item["Order_Qty"] for item in order_items)
        order["Items"] = order_items
        order["Total"] = total

        return order

    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()