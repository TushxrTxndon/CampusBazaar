from pydantic import BaseModel,EmailStr
class OrderCreate(BaseModel):
    EmailID: EmailStr

class OrderOut(BaseModel):
    OrderID: int
    OrderDate: str
    EmailID: EmailStr