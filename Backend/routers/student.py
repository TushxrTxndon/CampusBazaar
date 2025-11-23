from fastapi import APIRouter, HTTPException
from models.student import StudentCreate, StudentOut
from db import get_db
import mysql.connector

router = APIRouter(prefix="/students", tags=["Student"])

@router.post("/register")
def register_student(student: StudentCreate):
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO Student (EnrollmentNo, Course, Batch, EmailID)
            VALUES (%s, %s, %s, %s)
        """, (student.EnrollmentNo, student.Course, student.Batch, student.EmailID))

        conn.commit()
        return {"message": "Student registered"}

    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err))

    finally:
        cursor.close()
        conn.close()
