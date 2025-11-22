from pydantic import BaseModel,EmailStr
class ProductCreate(BaseModel):
    EmailID:str
    ProductName:str
    Description:str
    Price:float


class ProductOut(BaseModel):
    EmailID:str
    ProductName:str
    Description:str
    Price:float