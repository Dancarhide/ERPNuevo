from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, List, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.asistencia import Asistencia, DiaFestivo, Vacacion


def round_decimal(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calcular_isr_mensual(
    base_gravable: Decimal, tabla_isr_mensual: List[Tuple[Decimal, Decimal, Decimal, Decimal]]
) -> Decimal:
    """
    Calcula el ISR retenido usando la tabla mensual vigente.
    Cada tupla de tabla_isr_mensual debe ser:
    (limite_inferior, limite_superior, cuota_fija, porcentaje_sobre_excedente)
    """
    if base_gravable <= Decimal("0.00"):
        return Decimal("0.00")

    for lin_inf, lin_sup, cuota_fija, porcentaje in tabla_isr_mensual:
        if lin_inf <= base_gravable <= lin_sup:
            excedente = base_gravable - lin_inf
            impuesto_marginal = excedente * (porcentaje / Decimal("100.00"))
            isr_total = cuota_fija + impuesto_marginal
            return round_decimal(isr_total)

    # Si por alguna razón excede el último límite (no debería, el último suele ser 9999999)
    # se usa la última fila.
    lin_inf, lin_sup, cuota_fija, porcentaje = tabla_isr_mensual[-1]
    excedente = base_gravable - lin_inf
    impuesto_marginal = excedente * (porcentaje / Decimal("100.00"))
    return round_decimal(cuota_fija + impuesto_marginal)


def calcular_sbc(
    sueldo_diario: Decimal,
    dias_aguinaldo: int = 15,
    porcentaje_prima_vacacional: Decimal = Decimal("25.00"),
    dias_vacaciones: int = 12,
) -> Decimal:
    """
    Calcula el Salario Base de Cotización (SBC) o Salario Diario Integrado (SDI) inicial.
    Factor de integración = 1 + (dias_aguinaldo +
                            (dias_vacaciones * porcentaje_prima_vacacional / 100)) / 365
    """
    factor_integracion = Decimal("1.00") + (
        Decimal(dias_aguinaldo)
        + (Decimal(dias_vacaciones) * (porcentaje_prima_vacacional / Decimal("100.00")))
    ) / Decimal("365.00")

    return round_decimal(sueldo_diario * factor_integracion)


def calcular_cuota_obrera_imss(sbc: Decimal, dias_trabajados: int, uma: Decimal) -> Decimal:
    """
    Calcula las retenciones obreras del IMSS.
    Topado a 25 UMAs.
    """
    tope_sbc = uma * Decimal("25.00")
    sbc_topado = sbc if sbc <= tope_sbc else tope_sbc

    # 1. Enfermedad y Maternidad (Excedente de 3 UMAs) -> 0.40%
    # Aplica solo si SBC > 3 UMAs
    excedente_eym = Decimal("0.00")
    tres_umas = uma * Decimal("3.00")
    if sbc_topado > tres_umas:
        excedente_eym = (sbc_topado - tres_umas) * Decimal("0.0040") * Decimal(dias_trabajados)

    # 2. Invalidez y Vida -> 0.625%
    invalidez_vida = sbc_topado * Decimal("0.00625") * Decimal(dias_trabajados)

    # 3. Cesantía en Edad Avanzada y Vejez -> 1.125%
    cesantia_vejez = sbc_topado * Decimal("0.01125") * Decimal(dias_trabajados)

    cuota_total = excedente_eym + invalidez_vida + cesantia_vejez
    return round_decimal(cuota_total)


async def calcular_dias_pagados(
    empleado_id: int,
    fecha_inicio: date,
    fecha_fin: date,
    session: AsyncSession,
    fecha_ingreso: date | None = None,
    fecha_baja: date | None = None,
) -> Decimal:
    """
    Calcula los días efectivos a pagar descontando faltas injustificadas.
    Itera día a día evaluando, pero restringe el periodo al tiempo que el empleado
    estuvo realmente activo (entre fecha_ingreso y fecha_baja).
    """
    # Restringir las fechas de iteración según la vigencia del contrato
    fecha_inicio_calc = fecha_inicio
    if fecha_ingreso and fecha_ingreso > fecha_inicio:
        fecha_inicio_calc = fecha_ingreso

    fecha_fin_calc = fecha_fin
    if fecha_baja and fecha_baja < fecha_fin:
        fecha_fin_calc = fecha_baja

    if fecha_inicio_calc > fecha_fin_calc:
        return Decimal("0.00")

    # Obtener festivos
    res_festivos = await session.execute(
        select(DiaFestivo).where(
            DiaFestivo.fecha >= fecha_inicio_calc, DiaFestivo.fecha <= fecha_fin_calc
        )
    )
    festivos: Dict[date, DiaFestivo] = {df.fecha: df for df in res_festivos.scalars().all()}  # type: ignore

    # Obtener vacaciones aprobadas
    res_vacaciones = await session.execute(
        select(Vacacion).where(
            Vacacion.empleado_id == empleado_id,
            Vacacion.estatus_vacacion == "Aprobada",
            Vacacion.fecha_fin >= fecha_inicio_calc,
            Vacacion.fecha_inicio <= fecha_fin_calc,
        )
    )
    vacaciones_list = res_vacaciones.scalars().all()

    # Obtener asistencias
    res_asistencias = await session.execute(
        select(Asistencia).where(
            Asistencia.empleado_id == empleado_id,
            Asistencia.fecha >= fecha_inicio_calc,
            Asistencia.fecha <= fecha_fin_calc,
        )
    )
    asistencias: Dict[date, Asistencia] = {a.fecha: a for a in res_asistencias.scalars().all()}  # type: ignore

    dias_totales = (fecha_fin_calc - fecha_inicio_calc).days + 1
    faltas_injustificadas = 0

    current_date = fecha_inicio_calc
    while current_date <= fecha_fin_calc:
        # Es festivo?
        if current_date in festivos:
            current_date += timedelta(days=1)
            continue

        # Es vacacion?
        de_vacaciones = False
        for v in vacaciones_list:
            if v.fecha_inicio <= current_date <= v.fecha_fin:
                de_vacaciones = True
                break
        if de_vacaciones:
            current_date += timedelta(days=1)
            continue

        # Es Domingo?
        es_domingo = current_date.weekday() == 6

        # Buscar asistencia
        asistencia = asistencias.get(current_date)

        # Lógica de falta:
        # Si no hay registro y no es domingo -> Falta
        # Si hay registro y dice 'Falta' o 'Falta Injustificada' -> Falta

        es_falta = False
        if asistencia:
            if asistencia.tipo in ("Falta", "Falta Injustificada"):
                es_falta = True
        else:
            if not es_domingo:
                es_falta = True

        if es_falta:
            faltas_injustificadas += 1

        current_date += timedelta(days=1)

    from app.models.asistencia import Incidencia

    res_retardos = await session.execute(
        select(Incidencia).where(
            Incidencia.empleado_reportado_id == empleado_id,
            Incidencia.tipo == "Retardo",
            Incidencia.estatus == "Aprobada",
            Incidencia.fecha_incidencia >= fecha_inicio_calc,
            Incidencia.fecha_incidencia <= fecha_fin_calc,
        )
    )
    retardos = len(res_retardos.scalars().all())
    faltas_por_retardo = retardos // 3
    faltas_injustificadas += faltas_por_retardo

    # Si hay faltas, pierde parte proporcional del séptimo día (factor 1.1666 por falta aprox)
    dias_a_descontar = Decimal(faltas_injustificadas) * Decimal("1.1666")

    dias_pagados = Decimal(dias_totales) - dias_a_descontar
    if dias_pagados < Decimal("0.00"):
        dias_pagados = Decimal("0.00")

    # Modificación: en lugar de calcular aquí las horas extra automáticamente,
    # solo retornaremos el diccionario (ahora ya no calcula horas extra crudas)
    # Las horas extra se basarán en Incidencias aprobadas.
    return dias_pagados.quantize(Decimal("0.01"))


async def evaluar_percepciones_extra(
    empleado_id: int,
    fecha_inicio: date,
    fecha_fin: date,
    sueldo_diario: Decimal,
    session: AsyncSession,
) -> Dict[str, Decimal]:
    percepciones_extra = {
        "prima_dominical": Decimal("0.00"),
        "festivos_trabajados": Decimal("0.00"),
        "horas_extra": Decimal("0.00"),
    }

    # Obtener festivos
    res_festivos = await session.execute(
        select(DiaFestivo).where(DiaFestivo.fecha >= fecha_inicio, DiaFestivo.fecha <= fecha_fin)
    )
    festivos: Dict[date, DiaFestivo] = {df.fecha: df for df in res_festivos.scalars().all()}  # type: ignore

    # Obtener asistencias
    res_asistencias = await session.execute(
        select(Asistencia).where(
            Asistencia.empleado_id == empleado_id,
            Asistencia.fecha >= fecha_inicio,
            Asistencia.fecha <= fecha_fin,
        )
    )
    asistencias: Dict[date, Asistencia] = {a.fecha: a for a in res_asistencias.scalars().all()}  # type: ignore

    # Obtener Incidencias aprobadas de Horas Extra
    # asumiendo que no hay campo "horas", usaremos la gravedad o descripcion.
    # Por ahora, simplemente ponemos 0.00 y permitimos que un módulo lo maneje,
    # O pagamos una cuota fija, o parseamos descripcion.
    # TODO: Añadir un campo de monto o horas a Incidencia.

    current_date = fecha_inicio
    while current_date <= fecha_fin:
        asistencia = asistencias.get(current_date)
        if asistencia and (asistencia.hora_entrada or asistencia.tiempo_efectivo_minutos > 0):
            if current_date.weekday() == 6:
                percepciones_extra["prima_dominical"] += sueldo_diario * Decimal("0.25")
            df = festivos.get(current_date)
            if df and df.paga_doble:
                percepciones_extra["festivos_trabajados"] += sueldo_diario * Decimal("2.00")
        current_date += timedelta(days=1)

    for k in percepciones_extra:
        percepciones_extra[k] = percepciones_extra[k].quantize(Decimal("0.01"))

    return percepciones_extra
