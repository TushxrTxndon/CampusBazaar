from pydantic import BaseModel, EmailStr

class ListCreate(BaseModel):
    EmailID: EmailStr
    PID: str
    Stock: int
