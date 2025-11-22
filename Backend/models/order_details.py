from pydantic import BaseModel

class OrderDetailCreate(BaseModel):
    OrderID: int
    PID: str
    Order_Qty: int

class OrderDetailOut(BaseModel):
    OrderID: int
    PID: str
    Order_Qty: int

