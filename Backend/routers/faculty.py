from fastapi import APIRouter, HTTPException
from models.faculty import FacultyCreate
from db import get_db
import mysql.connector

router = APIRouter(prefix="/faculty", tags=["Faculty"])

@router.post("/register")
def register_faculty(faculty: FacultyCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Faculty (FacultyID, Department, Designation, EmailID)
            VALUES (%s, %s, %s, %s)
        """, (faculty.FacultyID, faculty.Department, faculty.Designation, faculty.EmailID))

        conn.commit()
        return {"message": "Faculty registered"}

    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err))

    finally:
        cursor.close()
        conn.close()
