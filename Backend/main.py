from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from pathlib import Path

from routers.users import router as users_router
from routers.student import router as student_router
from routers.faculty import router as faculty_router
from routers.products import router as products_router
from routers.category import router as category_router
from routers.product_category import router as product_category_router
from routers.feedback import router as feedback_router
from routers.upvotes import router as upvotes_router
from routers.orders import router as orders_router
from routers.order_details import router as order_details_router
from routers.lists import router as lists_router
from routers.product_images import router as product_images_router
from routers.payments import router as payments_router
from routers.stock import router as stock_router
from routers.oauth import router as oauth_router

app = FastAPI()

# Serve uploaded images
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Add SessionMiddleware for OAuth (must be before CORS)
import os
from dotenv import load_dotenv
load_dotenv()

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "your-secret-key-change-in-production-min-32-chars-long-please-change-this")
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY,
    max_age=3600  # 1 hour
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(student_router)
app.include_router(faculty_router)
app.include_router(products_router)
app.include_router(category_router)
app.include_router(product_category_router)
app.include_router(feedback_router)
app.include_router(upvotes_router)
app.include_router(orders_router)
app.include_router(order_details_router)
app.include_router(lists_router)
app.include_router(product_images_router)
app.include_router(payments_router)
app.include_router(stock_router)
app.include_router(oauth_router)

@app.get("/")
def home():
    return {"message": "CampusBazaar API running!"}
