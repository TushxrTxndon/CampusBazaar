from pydantic import BaseModel

class CategoryCreate(BaseModel):
    CategoryID: int
    CategoryName: str

class CategoryOut(BaseModel):
    CategoryID: int
    CategoryName: str
