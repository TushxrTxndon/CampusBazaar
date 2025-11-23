from fastapi import APIRouter, HTTPException
from models.users import UserCreate, UserOut, UserLogin
from passlib.hash import bcrypt
from db import get_db
import mysql.connector

router = APIRouter(prefix="/users", tags=["Users"])

def safe_bcrypt_hash(password: str):
    """
    Safely hash a password with bcrypt, ensuring it's <= 72 bytes.
    Bcrypt has a hard 72-byte limit and will throw an error if exceeded.
    """
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    password_safe = password_bytes.decode('utf-8', errors='ignore')
    return bcrypt.hash(password_safe)

def safe_bcrypt_verify(password: str, hashed: str):
    """
    Safely verify a password with bcrypt, ensuring it's <= 72 bytes.
    """
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    password_safe = password_bytes.decode('utf-8', errors='ignore')
    return bcrypt.verify(password_safe, hashed)

@router.post("/register")
def register_user(user: UserCreate):
    # Pydantic model already validates minimum password length (6 characters)
    
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Use safe bcrypt hash function that handles 72-byte limit automatically
        hashed_password = safe_bcrypt_hash(user.Password)
        
        cursor.execute("""
            INSERT INTO Users (EmailID, FirstName, LastName, Password)
            VALUES (%s, %s, %s, %s)
        """, (user.EmailID, user.FirstName, user.LastName, hashed_password))

        conn.commit()

        return {"message": "User registered"}

    except ValueError as e:
        # Catch bcrypt/passlib errors - bcrypt throws ValueError for passwords > 72 bytes
        error_msg = str(e)
        if "72" in error_msg or "byte" in error_msg.lower() or "truncate" in error_msg.lower():
            # Bcrypt error - try truncating and hashing again
            try:
                password_bytes = user.Password.encode('utf-8')[:72]
                password_to_hash = password_bytes.decode('utf-8', errors='ignore')
                hashed_password = bcrypt.hash(password_to_hash)
                cursor.execute("""
                    INSERT INTO Users (EmailID, FirstName, LastName, Password)
                    VALUES (%s, %s, %s, %s)
                """, (user.EmailID, user.FirstName, user.LastName, hashed_password))
                conn.commit()
                return {"message": "User registered"}
            except Exception:
                raise HTTPException(400, "Password is too long. Please use a shorter password.")
        # For Pydantic validation errors, pass through the message
        raise HTTPException(400, error_msg)
    except mysql.connector.Error as err:
        raise HTTPException(400, f"Database error: {err}")

    finally:
        cursor.close()
        conn.close()

@router.post("/login")
def login_user(credentials: UserLogin):
    # Pydantic model already validates password length
    # For login, we'll truncate if needed to match what was stored
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT EmailID, FirstName, LastName, Password
            FROM Users
            WHERE EmailID = %s
        """, (credentials.EmailID,))
        
        user = cursor.fetchone()

        if not user:
            raise HTTPException(401, "Invalid email or password")

        # Verify password using safe bcrypt verify function
        if not safe_bcrypt_verify(credentials.Password, user["Password"]):
            raise HTTPException(401, "Invalid email or password")

        # Check if user is a student
        cursor.execute("""
            SELECT EnrollmentNo, Course, Batch
            FROM Student
            WHERE EmailID = %s
        """, (user["EmailID"],))
        student = cursor.fetchone()

        # Check if user is faculty
        cursor.execute("""
            SELECT FacultyID, Department, Designation
            FROM Faculty
            WHERE EmailID = %s
        """, (user["EmailID"],))
        faculty = cursor.fetchone()

        response = {
            "EmailID": user["EmailID"],
            "FirstName": user["FirstName"],
            "LastName": user["LastName"],
            "UserType": "regular"
        }

        if student:
            response["UserType"] = "student"
            response["StudentInfo"] = student
        elif faculty:
            response["UserType"] = "faculty"
            response["FacultyInfo"] = faculty

        return response

    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(400, f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()

@router.get("/{email_id}")
def get_user_info(email_id: str):
    """Get user information including student/faculty status"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT EmailID, FirstName, LastName
            FROM Users
            WHERE EmailID = %s
        """, (email_id,))
        
        user = cursor.fetchone()

        if not user:
            raise HTTPException(404, "User not found")

        # Check if user is a student
        cursor.execute("""
            SELECT EnrollmentNo, Course, Batch
            FROM Student
            WHERE EmailID = %s
        """, (email_id,))
        student = cursor.fetchone()

        # Check if user is faculty
        cursor.execute("""
            SELECT FacultyID, Department, Designation
            FROM Faculty
            WHERE EmailID = %s
        """, (email_id,))
        faculty = cursor.fetchone()

        response = {
            **user,
            "UserType": "regular"
        }

        if student:
            response["UserType"] = "student"
            response["StudentInfo"] = student
        elif faculty:
            response["UserType"] = "faculty"
            response["FacultyInfo"] = faculty

        return response

    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(400, f"Database error: {err}")
    finally:
        cursor.close()
        conn.close()
