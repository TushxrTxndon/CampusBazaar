from pydantic import BaseModel
from typing import Optional

class ProductImageCreate(BaseModel):
    PID: str
    ImageURL: str
    DisplayOrder: Optional[int] = 0

class ProductImageOut(BaseModel):
    ImageID: int
    PID: str
    ImageURL: str
    DisplayOrder: int

