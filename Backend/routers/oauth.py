from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from db import get_db
import mysql.connector
from passlib.hash import bcrypt
import secrets
import os
import json
import urllib.parse
from dotenv import load_dotenv

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

load_dotenv()

router = APIRouter(prefix="/oauth", tags=["OAuth"])

# OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Initialize OAuth
oauth = OAuth()

# Register Google OAuth provider
# Only register if credentials are available
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

@router.get("/login/google")
async def google_login(request: Request, mode: str = "login"):
    """Initiate Google OAuth login or signup
    
    Args:
        mode: 'login' or 'signup' - determines the flow type
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(500, "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env")
    
    # Redirect URI should point to backend callback endpoint
    # Google will redirect here, then we redirect to frontend
    backend_url = str(request.base_url).rstrip('/')
    redirect_uri = f"{backend_url}/oauth/callback"
    
    # Store mode in session so callback knows if it's login or signup
    request.session['oauth_mode'] = mode
    
    try:
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        raise HTTPException(500, f"Failed to initiate OAuth login: {str(e)}")

@router.get("/callback")
async def oauth_callback(request: Request):
    """Handle OAuth callback from Google - works for both login and signup"""
    try:
        # Get the mode from session (login or signup)
        mode = request.session.get('oauth_mode', 'login')
        
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            # Fallback: fetch user info from token
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f"Bearer {token['access_token']}"}
                )
                user_info = response.json()
        
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        picture = user_info.get('picture', '')
        
        if not email:
            raise HTTPException(400, "Email not provided by OAuth provider")
        
        # Check if user exists, if not create one
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check if user exists
            cursor.execute("""
                SELECT EmailID, FirstName, LastName
                FROM Users
                WHERE EmailID = %s
            """, (email,))
            
            user = cursor.fetchone()
            
            if not user:
                # For signup mode, create new user
                # For login mode, also create user (OAuth auto-registration)
                # Generate a password for OAuth user (they don't need to know it)
                random_password = secrets.token_urlsafe(32)  # This generates ~43 characters, well within limit
                try:
                    # Use safe bcrypt hash to avoid 72-byte errors
                    hashed_password = safe_bcrypt_hash(random_password)
                    cursor.execute("""
                        INSERT INTO Users (EmailID, FirstName, LastName, Password)
                        VALUES (%s, %s, %s, %s)
                    """, (email, first_name, last_name, hashed_password))
                    conn.commit()
                    
                    # Fetch the newly created user
                    cursor.execute("""
                        SELECT EmailID, FirstName, LastName
                        FROM Users
                        WHERE EmailID = %s
                    """, (email,))
                    user = cursor.fetchone()
                except mysql.connector.IntegrityError:
                    # User might have been created between check and insert
                    cursor.execute("""
                        SELECT EmailID, FirstName, LastName
                        FROM Users
                        WHERE EmailID = %s
                    """, (email,))
                    user = cursor.fetchone()
            
            # Check if user is a student
            cursor.execute("""
                SELECT EnrollmentNo, Course, Batch
                FROM Student
                WHERE EmailID = %s
            """, (email,))
            student = cursor.fetchone()

            # Check if user is faculty
            cursor.execute("""
                SELECT FacultyID, Department, Designation
                FROM Faculty
                WHERE EmailID = %s
            """, (email,))
            faculty = cursor.fetchone()

            response_data = {
                "EmailID": user["EmailID"],
                "FirstName": user["FirstName"],
                "LastName": user["LastName"],
                "UserType": "regular",
                "Picture": picture
            }

            if student:
                response_data["UserType"] = "student"
                response_data["StudentInfo"] = student
            elif faculty:
                response_data["UserType"] = "faculty"
                response_data["FacultyInfo"] = faculty
            
            # Clear session mode
            request.session.pop('oauth_mode', None)
            
            # Redirect to frontend with user data as query params
            # In production, use JWT tokens or session cookies
            user_data_json = json.dumps(response_data)
            redirect_url = f"{FRONTEND_URL}/oauth/callback?success=true&user={urllib.parse.quote(user_data_json)}&mode={mode}"
            
            return RedirectResponse(url=redirect_url)
            
        except mysql.connector.Error as err:
            raise HTTPException(400, f"Database error: {err}")
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        error_msg = str(e)
        redirect_url = f"{FRONTEND_URL}/oauth/callback?success=false&error={urllib.parse.quote(error_msg)}"
        return RedirectResponse(url=redirect_url)

@router.get("/providers")
def get_oauth_providers():
    """Get available OAuth providers"""
    providers = []
    
    if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
        providers.append({
            "name": "google",
            "display_name": "Google",
            "enabled": True,
            "login_url": "/oauth/login/google"
        })
    
    return {"providers": providers}

