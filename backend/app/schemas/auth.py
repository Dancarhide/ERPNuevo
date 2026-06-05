from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: int
    nombre_completo: str
    email: str
    rol: str | None
    requiere_cambio_contrasena: bool


class ChangePasswordRequest(BaseModel):
    new_password: str
