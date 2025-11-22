from pydantic import BaseModel, EmailStr

class FacultyCreate(BaseModel):
    FacultyID: str
    Department: str
    Designation: str
    EmailID: EmailStr

class FacultyOut(BaseModel):
    FacultyID: str
    Department: str
    Designation: str
    EmailID: EmailStr
