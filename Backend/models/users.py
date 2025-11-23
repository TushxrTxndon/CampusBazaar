from pydantic import BaseModel, EmailStr, field_validator

class UserCreate(BaseModel):
    EmailID: EmailStr
    FirstName: str
    LastName: str
    Password: str
    
    @field_validator('Password')
    @classmethod
    def validate_password(cls, v: str):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        # No maximum length check - bcrypt will handle truncation automatically
        # We just ensure it's not empty and meets minimum requirements
        return v


class UserOut(BaseModel):
    EmailID: EmailStr
    FirstName: str
    LastName: str

class UserLogin(BaseModel):
    EmailID: EmailStr
    Password: str
    
    @field_validator('Password')
    @classmethod
    def validate_password(cls, v: str):
        # No validation needed for login - just ensure it's not empty
        if not v:
            raise ValueError('Password is required')
        return v