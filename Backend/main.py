from fastapi import FastAPI
from routers.users import router as users_router

app = FastAPI(
    title="CampusBazaar API",
    description="Backend for CampusBazaar project",
    version="1.0"
)

# include only users router for now
app.include_router(users_router)

@app.get("/")
def home():
    return {"message": "CampusBazaar API is running!"}

