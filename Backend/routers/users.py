from fastapi import APIRouter, HTTPException
from models.users import UserCreate, UserOut
from passlib.hash import bcrypt
from db import get_db
import mysql.connector

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
def register_user(user: UserCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Users (EmailID, FirstName, LastName, Password)
            VALUES (%s, %s, %s, %s)
        """, (user.EmailID, user.FirstName, user.LastName, bcrypt.hash(user.Password)))

        conn.commit()

        return {"message": "User registered"}

    except mysql.connector.Error as err:
        raise HTTPException(400, f"Database error: {err}")

    finally:
        cursor.close()
        conn.close()
