from fastapi import APIRouter, HTTPException
from models.feedbacks import FeedbackCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.get("/product/{pid}")
def get_product_feedbacks(pid: str):
    """Get all feedbacks for a product"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT f.FeedBackID, f.Date, f.Rating, f.Review, f.Upvotes, 
                   f.EmailID, u.FirstName, u.LastName
            FROM FeedBacks f
            INNER JOIN Users u ON f.EmailID = u.EmailID
            WHERE f.PID = %s
            ORDER BY f.Upvotes DESC, f.Date DESC
        """, (pid,))
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.post("/add")
def add_feedback(fb: FeedbackCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO FeedBacks (FeedBackID, Date, Rating, Review, Upvotes, EmailID, PID)
            VALUES (%s, %s, %s, %s, 0, %s, %s)
        """, (fb.FeedBackID, fb.Date, fb.Rating, fb.Review, fb.EmailID, fb.PID))

        conn.commit()
        return {"message": "Feedback added"}

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))

    finally:
        cursor.close()
        conn.close()
