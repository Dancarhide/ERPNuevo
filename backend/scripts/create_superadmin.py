import argparse
import asyncio
import secrets
import string
import sys

# Añadimos el directorio raíz al path para poder importar la app
from pathlib import Path

from sqlalchemy.future import select

sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.database import async_sessionmaker, create_async_engine
from app.core.security import get_password_hash
from app.models.empleados import Empleado
from app.models.seguridad import Credencial, Rol


def generate_random_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for i in range(length))


async def create_superadmin(email: str):
    engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    session = async_sessionmaker(engine, expire_on_commit=False)()

    try:
        # Verificar si el email ya existe
        result = await session.execute(select(Empleado).where(Empleado.email == email))
        if result.scalar_one_or_none():
            print(f"Error: Ya existe un empleado con el correo {email}")
            return

        # 1. Crear el Rol "Superadmin" si no existe
        result = await session.execute(select(Rol).where(Rol.nombre_rol == "Superadmin"))
        superadmin_rol = result.scalar_one_or_none()

        if not superadmin_rol:
            superadmin_rol = Rol(
                nombre_rol="Superadmin",
                descripcion="Administrador Global del ERP",
                es_sistema=True,
                nivel_jerarquia=1,
            )
            session.add(superadmin_rol)
            await session.commit()
            await session.refresh(superadmin_rol)
            print("=> Creado Rol Superadmin")

            # Asignar permisos si existen (simulado).
            # En un sistema real se iteran Recurso y Permiso y se ligan a RolPermiso.

        # 2. Crear Empleado
        empleado = Empleado(
            nombre_completo="Super Administrador",
            email=email,
            rol_id=superadmin_rol.id,
            estatus="Activo",
        )
        session.add(empleado)
        await session.commit()
        await session.refresh(empleado)
        print(f"=> Creado Empleado (ID: {empleado.id})")

        # 3. Crear Credencial
        password_plana = generate_random_password()
        hashed_password = get_password_hash(password_plana)

        credencial = Credencial(
            empleado_id=empleado.id,
            nombre_usuario=email,
            contrasena_hasheada=hashed_password,
            requiere_cambio_contrasena=True,
        )
        session.add(credencial)
        await session.commit()

        print("\n" + "=" * 50)
        print("SUPER ADMIN CREADO EXITOSAMENTE")
        print("=" * 50)
        print(f"Email / Usuario: {email}")
        print(f"Contraseña:      {password_plana}")
        print("=" * 50)
        print("¡Guarda esta contraseña! El usuario deberá cambiarla en su primer login.")

    except Exception as e:
        await session.rollback()
        print(f"Error fatal: {e}")
    finally:
        await session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crear Súper Administrador del ERP")
    parser.add_argument("email", help="El correo electrónico del súper administrador")
    args = parser.parse_args()

    asyncio.run(create_superadmin(args.email))
