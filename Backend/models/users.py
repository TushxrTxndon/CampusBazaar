from pydantic import BaseModel,EmailStr
class UserCreate(BaseModel):
    EmailID:str
    FirstName:str
    LastName:str
    Password:str


class UserOut(BaseModel):
    EmailID: EmailStr
    FirstName: str
    LastName: str