from fastapi import APIRouter, HTTPException
from models.category import CategoryCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/category", tags=["Category"])

@router.get("/")
def get_all_categories():
    """Get all categories"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT CategoryID, CategoryName FROM Category ORDER BY CategoryName")
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.post("/add")
def add_category(category: CategoryCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Category (CategoryID, CategoryName)
            VALUES (%s, %s)
        """, (category.CategoryID, category.CategoryName))

        conn.commit()
        return {"message": "Category added"}

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))

    finally:
        cursor.close()
        conn.close()
