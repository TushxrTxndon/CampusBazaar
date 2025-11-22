from fastapi import FastAPI
from models import products
from db import get_db
app=FastAPI()
@app.get("/")
def greet():
    return "Hello world"