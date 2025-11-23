from fastapi import APIRouter, HTTPException
from models.review_upvotes import ReviewUpvoteCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/upvotes", tags=["Upvotes"])

@router.post("/add")
def add_upvote(vote: ReviewUpvoteCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Review_Upvotes (FeedBackID, VoterEmail)
            VALUES (%s, %s)
        """, (vote.FeedBackID, vote.VoterEmail))

        conn.commit()
        return {"message": "Upvote added"}

    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err))

    finally:
        cursor.close()
        conn.close()
