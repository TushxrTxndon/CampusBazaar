from fastapi import APIRouter, HTTPException
from models.product_category import ProductCategoryCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/product-category", tags=["Product Category"])

@router.post("/assign")
def assign_category(item: ProductCategoryCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Product_Category (PID, CategoryID)
            VALUES (%s, %s)
        """, (item.PID, item.CategoryID))

        conn.commit()
        return {"message": "Category assigned to product"}

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))

    finally:
        cursor.close()
        conn.close()
