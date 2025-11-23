from pydantic import BaseModel

class ProductCategoryCreate(BaseModel):
    PID: str
    CategoryID: int
