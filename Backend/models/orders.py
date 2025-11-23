from pydantic import BaseModel,EmailStr
from datetime import date

class OrderCreate(BaseModel):
    EmailID: EmailStr
    OrderDate: date

class OrderOut(BaseModel):
    OrderID: int
    OrderDate: str
    EmailID: EmailStr