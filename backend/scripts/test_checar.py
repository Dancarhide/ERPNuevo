from datetime import datetime

import httpx

# URL del backend
BASE_URL = "http://localhost:8000/api"

# Credenciales de prueba
USERNAME = "rrhh@empresa.com"
PASSWORD = "password"


def test_checar_con_sesion():
    print("Probando checado web simulando sesión activa...")

    with httpx.Client() as client:
        # 1. Login para obtener token
        login_data = {"email": USERNAME, "password": PASSWORD}
        print("Iniciando sesión...")
        response = client.post(f"{BASE_URL}/auth/login", json=login_data)

        if response.status_code != 200:
            print("[ERROR] de inicio de sesión:")
            print(response.json())
            return

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Llamar al endpoint /checar
        print("Enviando petición de checada...")
        checada_resp = client.post(f"{BASE_URL}/asistencias/checar", headers=headers)

        if checada_resp.status_code == 200:
            data = checada_resp.json()
            print("[OK] Checada web exitosa!")
            print(f"ID Empleado: {data['empleado_id']}")
            print(f"Timestamp: {data['timestamp_checada']}")
            print(f"Método: {data['metodo']}")
        else:
            print("[ERROR] al checar:")
            print(checada_resp.json())


def test_checar_webhook():
    print("\n----------------------------------")
    print("Probando endpoint Webhook (Simulando dispositivo ZKTeco)...")

    with httpx.Client() as client:
        # Simulamos un payload del checador
        payload = {
            "empleado_id": 5,  # Asume que el empleado con ID 5 existe
            "timestamp_checada": datetime.now().isoformat(),
            "metodo": "Huella",
            "dispositivo_ip": "192.168.1.50",
        }

        response = client.post(f"{BASE_URL}/asistencias/webhook", json=payload)

        if response.status_code == 200:
            data = response.json()
            print("[OK] Checada de webhook exitosa!")
            print(f"ID Empleado: {data['empleado_id']}")
            print(f"Timestamp: {data['timestamp_checada']}")
            print(f"Dispositivo IP: {data['dispositivo_ip']}")
        else:
            print("[ERROR] al enviar webhook:")
            print(response.text)


if __name__ == "__main__":
    test_checar_con_sesion()
    test_checar_webhook()
