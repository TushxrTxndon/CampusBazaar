from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    PID: Optional[str] = None  # Auto-generated if not provided
    ProductName: str
    Description: str
    Price: float
    # Note: Images are now managed via Product_Images table, use /product-images endpoints


class ProductOut(BaseModel):
    EmailID:str
    ProductName:str
    Description:str
    Price:float