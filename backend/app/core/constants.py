from decimal import Decimal

# Variables Fiscales Anuales (México - 2024)
# En una aplicación real, estos valores pueden moverse a una tabla de base de datos
# para que Recursos Humanos los edite cada 1 de Enero.

UMA_2024 = Decimal("108.57")
SALARIO_MINIMO_GENERAL_2024 = Decimal("248.93")
SALARIO_MINIMO_FRONTERA_2024 = Decimal("374.89")
DIAS_MES_PROMEDIO = Decimal("30.4")

# Tabla ISR Mensual (Limites Inferiores)
TABLA_ISR_MENSUAL = [
    (Decimal("0.01"), Decimal("746.04"), Decimal("0.00"), Decimal("1.92")),
    (Decimal("746.05"), Decimal("6332.05"), Decimal("14.32"), Decimal("6.40")),
    (Decimal("6332.06"), Decimal("11128.01"), Decimal("371.83"), Decimal("10.88")),
    (Decimal("11128.02"), Decimal("12935.82"), Decimal("893.63"), Decimal("16.00")),
    (Decimal("12935.83"), Decimal("15487.71"), Decimal("1182.88"), Decimal("17.92")),
    (Decimal("15487.72"), Decimal("31236.49"), Decimal("1640.18"), Decimal("21.36")),
    (Decimal("31236.50"), Decimal("49233.00"), Decimal("5004.12"), Decimal("23.52")),
    (Decimal("49233.01"), Decimal("93993.90"), Decimal("9236.89"), Decimal("30.00")),
    (Decimal("93993.91"), Decimal("125325.20"), Decimal("22665.17"), Decimal("32.00")),
    (Decimal("125325.21"), Decimal("375975.61"), Decimal("32691.18"), Decimal("34.00")),
    (Decimal("375975.62"), Decimal("9999999.99"), Decimal("117912.32"), Decimal("35.00")),
]
