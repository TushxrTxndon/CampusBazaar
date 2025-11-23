from fastapi import APIRouter, HTTPException, Query
from models.lists import ListCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/lists", tags=["Lists"])

@router.post("/add")
def add_to_list(list_item: ListCreate):
    """Add a product to a user's listing (seller adds product to their inventory)"""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Lists (EmailID, PID, Stock)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE Stock = Stock + %s
        """, (list_item.EmailID, list_item.PID, list_item.Stock, list_item.Stock))

        conn.commit()
        return {"message": "Product added to list"}

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))

    finally:
        cursor.close()
        conn.close()

@router.get("/user/{email_id}")
def get_user_listings(email_id: str):
    """Get all products listed by a specific user"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT p.PID, p.ProductName, p.Description, p.Price, l.Stock
            FROM Products p
            INNER JOIN Lists l ON p.PID = l.PID
            WHERE l.EmailID = %s
        """, (email_id,))
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.get("/product/{pid}")
def get_product_sellers(pid: str):
    """Get all sellers (users) who have this product in their list"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT l.EmailID, u.FirstName, u.LastName, l.Stock
            FROM Lists l
            INNER JOIN Users u ON l.EmailID = u.EmailID
            WHERE l.PID = %s AND l.Stock > 0
        """, (pid,))
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.put("/update")
def update_listing(list_item: ListCreate):
    """Update stock for a product in user's listing"""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE Lists
            SET Stock = %s
            WHERE EmailID = %s AND PID = %s
        """, (list_item.Stock, list_item.EmailID, list_item.PID))

        if cursor.rowcount == 0:
            raise HTTPException(404, "Listing not found")

        conn.commit()
        return {"message": "Listing updated"}

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.delete("/remove")
def remove_listing(email_id: str = Query(...), pid: str = Query(...)):
    """Remove a product from user's listing. If no users have it listed, delete the product entirely."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # First, remove the listing
        cursor.execute("""
            DELETE FROM Lists
            WHERE EmailID = %s AND PID = %s
        """, (email_id, pid))

        if cursor.rowcount == 0:
            raise HTTPException(404, "Listing not found")

        # Check if any other users still have this product listed
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM Lists
            WHERE PID = %s
        """, (pid,))
        
        remaining_listings = cursor.fetchone()[0]
        
        # If no one else has this product listed, try to delete it from Products table
        # Note: Products with order history will NOT be deleted (foreign key constraint prevents it)
        if remaining_listings == 0:
            # Check if product has order history before attempting deletion
            cursor.execute("""
                SELECT COUNT(*) as order_count
                FROM Order_Details
                WHERE PID = %s
            """, (pid,))
            
            order_count = cursor.fetchone()[0]
            
            if order_count > 0:
                # Product has order history - don't delete it, just remove from listings
                conn.commit()
                return {
                    "message": "Listing removed. Product kept in database due to order history.",
                    "product_deleted": False,
                    "has_order_history": True
                }
            else:
                # No order history - safe to delete
                cursor.execute("""
                    DELETE FROM Products
                    WHERE PID = %s
                """, (pid,))
                
                # Check if product was actually deleted
                if cursor.rowcount > 0:
                    conn.commit()
                    return {
                        "message": "Listing removed and product deleted (no longer listed by anyone)",
                        "product_deleted": True,
                        "has_order_history": False
                    }
                else:
                    # Product might have been deleted already or doesn't exist
                    conn.commit()
                    return {
                        "message": "Listing removed",
                        "product_deleted": False,
                        "has_order_history": False
                    }
        else:
            # Other users still have this product listed
            conn.commit()
            return {
                "message": "Listing removed",
                "product_deleted": False
            }

    except mysql.connector.Error as err:
        conn.rollback()
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

