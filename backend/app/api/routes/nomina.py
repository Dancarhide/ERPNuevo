"""
Módulo de Nómina — Rutas API

Gestión de Lotes de Nómina, Recibos Individuales, Catálogo de Conceptos
y generación de XML CFDI y recibos PDF.
"""

import csv
import io
import json
from decimal import Decimal
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import RequirePermission, get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.nomina import ConceptoNomina, DetalleNomina, LoteNomina, Nomina
from app.models.parametros_fiscales import ParametroFiscal
from app.schemas.nomina import (
    ConceptoNominaCreate,
    ConceptoNominaResponse,
    ConceptoNominaUpdate,
    LoteNominaCreate,
    LoteNominaDetalle,
    LoteNominaResponse,
    NominaCreate,
    NominaListItem,
    NominaResponse,
    NominaUpdate,
    ReciboPDFResponse,
    ReciboXMLResponse,
)
from app.services.calculadora_nomina import (
    calcular_cuota_obrera_imss,
    calcular_dias_pagados,
    calcular_isr_mensual,
    calcular_sbc,
)
from app.services.cfdi_service import CFDIService, PACException

router = APIRouter()


# ═══════════════════════════════════════════════════════════════
# CATÁLOGO DE CONCEPTOS
# ═══════════════════════════════════════════════════════════════


@router.get("/conceptos", response_model=List[ConceptoNominaResponse])
async def get_conceptos(
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
    tipo: Optional[str] = Query(None, description="Percepcion, Deduccion, OtroPago"),
    activo: Optional[bool] = Query(None),
):
    q = select(ConceptoNomina)
    if tipo:
        q = q.where(ConceptoNomina.tipo == tipo)
    if activo is not None:
        q = q.where(ConceptoNomina.activo == activo)
    q = q.order_by(ConceptoNomina.tipo, ConceptoNomina.clave)
    res = await session.execute(q)
    return res.scalars().all()


@router.post(
    "/conceptos", response_model=ConceptoNominaResponse, status_code=status.HTTP_201_CREATED
)
async def create_concepto(
    data: ConceptoNominaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    existing = await session.execute(
        select(ConceptoNomina).where(ConceptoNomina.clave == data.clave)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400, detail=f"Ya existe un concepto con la clave '{data.clave}'"
        )
    concepto = ConceptoNomina(**data.model_dump())
    session.add(concepto)
    await session.commit()
    await session.refresh(concepto)
    return concepto


@router.put("/conceptos/{concepto_id}", response_model=ConceptoNominaResponse)
async def update_concepto(
    concepto_id: int,
    data: ConceptoNominaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    concepto = await session.get(ConceptoNomina, concepto_id)
    if not concepto:
        raise HTTPException(status_code=404, detail="Concepto no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(concepto, field, value)
    await session.commit()
    await session.refresh(concepto)
    return concepto


@router.delete("/conceptos/{concepto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_concepto(
    concepto_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    concepto = await session.get(ConceptoNomina, concepto_id)
    if not concepto:
        raise HTTPException(status_code=404, detail="Concepto no encontrado")
    # No eliminar si tiene detalles asociados
    res = await session.execute(
        select(DetalleNomina).where(DetalleNomina.concepto_id == concepto_id).limit(1)
    )
    if res.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un concepto que ya está en uso. Desactívalo en su lugar.",
        )
    await session.delete(concepto)
    await session.commit()


# ═══════════════════════════════════════════════════════════════
# CONCEPTOS ESTÁNDAR SAT (SEED)
# ═══════════════════════════════════════════════════════════════

CONCEPTOS_SAT_SEED = [
    # Percepciones
    dict(
        clave="P001",
        nombre_concepto="Sueldo Base",
        tipo="Percepcion",
        clave_sat="001",
        tipo_sat="P",
        es_exento=False,
        es_obligatorio=True,
        monto_defecto=0,
    ),
    dict(
        clave="P002",
        nombre_concepto="Horas Extra",
        tipo="Percepcion",
        clave_sat="019",
        tipo_sat="P",
        es_exento=True,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="P003",
        nombre_concepto="Prima Vacacional",
        tipo="Percepcion",
        clave_sat="011",
        tipo_sat="P",
        es_exento=True,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="P004",
        nombre_concepto="Vales de Despensa",
        tipo="Percepcion",
        clave_sat="036",
        tipo_sat="P",
        es_exento=True,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="P005",
        nombre_concepto="Bonos y Compensaciones",
        tipo="Percepcion",
        clave_sat="047",
        tipo_sat="P",
        es_exento=False,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="P006",
        nombre_concepto="Aguinaldo",
        tipo="Percepcion",
        clave_sat="002",
        tipo_sat="P",
        es_exento=True,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    # Deducciones
    dict(
        clave="D001",
        nombre_concepto="IMSS Cuota Obrera",
        tipo="Deduccion",
        clave_sat="001",
        tipo_sat="D",
        es_exento=False,
        es_obligatorio=True,
        monto_defecto=0,
    ),
    dict(
        clave="D002",
        nombre_concepto="ISR Retenido",
        tipo="Deduccion",
        clave_sat="002",
        tipo_sat="D",
        es_exento=False,
        es_obligatorio=True,
        monto_defecto=0,
    ),
    dict(
        clave="D003",
        nombre_concepto="INFONAVIT",
        tipo="Deduccion",
        clave_sat="005",
        tipo_sat="D",
        es_exento=False,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="D004",
        nombre_concepto="Fondo de Ahorro",
        tipo="Deduccion",
        clave_sat="013",
        tipo_sat="D",
        es_exento=False,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="D005",
        nombre_concepto="Pensión Alimenticia",
        tipo="Deduccion",
        clave_sat="007",
        tipo_sat="D",
        es_exento=False,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="D006",
        nombre_concepto="Préstamo a la Empresa",
        tipo="Deduccion",
        clave_sat="009",
        tipo_sat="D",
        es_exento=False,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    dict(
        clave="D007",
        nombre_concepto="Descuento por Incapacidad",
        tipo="Deduccion",
        clave_sat="006",
        tipo_sat="D",
        es_exento=False,
        es_obligatorio=False,
        monto_defecto=0,
    ),
    # Otros Pagos
    dict(
        clave="O001",
        nombre_concepto="Subsidio al Empleo",
        tipo="OtroPago",
        clave_sat="002",
        tipo_sat="O",
        es_exento=True,
        es_obligatorio=False,
        monto_defecto=0,
    ),
]


@router.post("/conceptos/seed", status_code=status.HTTP_200_OK)
async def seed_conceptos(
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    """
    Carga el catálogo estándar SAT de conceptos.
    No sobreescribe conceptos existentes (upsert por clave).
    """
    creados = 0
    omitidos = 0
    for c in CONCEPTOS_SAT_SEED:
        existing = await session.execute(
            select(ConceptoNomina).where(ConceptoNomina.clave == c["clave"])
        )
        if existing.scalars().first():
            omitidos += 1
            continue
        concepto = ConceptoNomina(**c)
        session.add(concepto)
        creados += 1
    await session.commit()
    return {"creados": creados, "omitidos": omitidos, "total_seed": len(CONCEPTOS_SAT_SEED)}


@router.get("/lotes", response_model=List[LoteNominaResponse])
async def get_lotes(
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
    año: Optional[int] = Query(None),
    estatus: Optional[str] = Query(None),
    periodicidad: Optional[str] = Query(None),
):
    q = select(LoteNomina)
    if año:
        q = q.where(LoteNomina.año == año)
    if estatus:
        q = q.where(LoteNomina.estatus == estatus)
    if periodicidad:
        q = q.where(LoteNomina.periodicidad == periodicidad)
    q = q.order_by(LoteNomina.periodo_inicio.desc())
    res = await session.execute(q)
    return res.scalars().all()


@router.post("/lotes", response_model=LoteNominaResponse, status_code=status.HTTP_201_CREATED)
async def create_lote(
    data: LoteNominaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    existing = await session.get(LoteNomina, data.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Ya existe un lote con el ID '{data.id}'")
    lote = LoteNomina(
        **data.model_dump(),
        creado_por_id=current_user.id,
    )
    session.add(lote)
    await session.commit()
    await session.refresh(lote)
    return lote


@router.get("/lotes/{lote_id}", response_model=LoteNominaDetalle)
async def get_lote(
    lote_id: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    res = await session.execute(
        select(LoteNomina)
        .where(LoteNomina.id == lote_id)
        .options(selectinload(LoteNomina.nominas).selectinload(Nomina.empleado))
    )
    lote = res.scalars().first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    # Construir lista compacta de nóminas
    nominas_list = [
        NominaListItem(
            id=n.id,
            empleado_id=n.empleado_id,
            empleado_nombre=n.empleado.nombre_completo if n.empleado else "—",
            sueldo_base=n.sueldo_base,
            subtotal_percepciones=n.subtotal_percepciones,
            subtotal_deducciones=n.subtotal_deducciones,
            neto_pagar=n.neto_pagar,
            dias_trabajados=n.dias_trabajados,
            estado=n.estado,
            estatus_sat=n.estatus_sat,
        )
        for n in lote.nominas
    ]

    return LoteNominaDetalle(
        id=lote.id,
        descripcion=lote.descripcion,
        periodicidad=lote.periodicidad,
        numero_periodo=lote.numero_periodo,
        año=lote.año,
        periodo_inicio=lote.periodo_inicio,
        periodo_fin=lote.periodo_fin,
        tipo_nomina=lote.tipo_nomina,
        numero_empleados=lote.numero_empleados,
        total_percepciones=lote.total_percepciones,
        total_deducciones=lote.total_deducciones,
        total_neto=lote.total_neto,
        estatus=lote.estatus,
        nominas=nominas_list,
    )


@router.post("/lotes/{lote_id}/procesar", response_model=LoteNominaResponse)
async def procesar_lote(
    lote_id: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    """
    Genera automáticamente un recibo de nómina borrador para cada empleado activo
    cuya periodicidad coincide con el lote. Solo aplica conceptos obligatorios del catálogo.
    El contador deberá revisar y ajustar cada recibo individualmente.
    """
    res_lote = await session.execute(
        select(LoteNomina).where(LoteNomina.id == lote_id).with_for_update()
    )
    lote = res_lote.scalar_one_or_none()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    if lote.estatus != "Borrador":
        raise HTTPException(
            status_code=400, detail="Solo se puede procesar un lote en estado Borrador"
        )

    # Obtener empleados aplicables considerando fechas de alta y baja
    from sqlalchemy import or_

    res_empleados = await session.execute(
        select(Empleado).where(
            Empleado.es_sistema.is_(False),
            or_(Empleado.fecha_ingreso.is_(None), Empleado.fecha_ingreso <= lote.periodo_fin),
            or_(Empleado.fecha_baja.is_(None), Empleado.fecha_baja >= lote.periodo_inicio),
        )
    )
    empleados = res_empleados.scalars().all()

    # Filtrar empleados cuya periodicidad coincide o no tienen específica
    empleados_aplicables = [
        e
        for e in empleados
        if (e.periodicidad_nomina is None or e.periodicidad_nomina == lote.periodicidad)
    ]

    # Obtener parámetros fiscales del año del lote
    año_lote = lote.periodo_inicio.year
    res_param = await session.execute(
        select(ParametroFiscal)
        .where(ParametroFiscal.ejercicio <= año_lote)
        .order_by(ParametroFiscal.ejercicio.desc())
    )
    param_fiscal = res_param.scalars().first()

    if not param_fiscal:
        raise HTTPException(
            status_code=500,
            detail=f"No hay parámetros fiscales (UMA, ISR) configurados para el año {año_lote}",
        )

    uma_actual = param_fiscal.uma
    try:
        tabla_isr_actual = json.loads(param_fiscal.tabla_isr_mensual)
        tabla_isr_parsed = [
            (
                Decimal(str(r["limite_inferior"])),
                Decimal(str(r["limite_superior"])),
                Decimal(str(r["cuota_fija"])),
                Decimal(str(r["porcentaje"])),
            )
            for r in tabla_isr_actual
        ]
    except Exception:
        raise HTTPException(
            status_code=500, detail="Formato JSON inválido en la tabla ISR configurada."
        )

    # Obtener TODO el catálogo activo
    res_conceptos = await session.execute(select(ConceptoNomina).where(ConceptoNomina.activo))
    conceptos: dict[str, ConceptoNomina] = {c.clave: c for c in res_conceptos.scalars().all()}  # type: ignore

    # Asegurarnos que existan los conceptos obligatorios (P001, D001, D002)
    c_sueldo = conceptos.get("P001")
    c_imss = conceptos.get("D001")
    c_isr = conceptos.get("D002")
    c_infonavit = conceptos.get("D003")

    if not c_sueldo or not c_imss or not c_isr or not c_infonavit:
        raise HTTPException(
            status_code=500,
            detail="Faltan conceptos base SAT P001, D001, D002 o D003 en el catálogo.",
        )

    total_percepciones = Decimal("0.00")
    total_deducciones = Decimal("0.00")

    for emp in empleados_aplicables:
        dias_periodo = (
            15
            if lote.periodicidad == "Quincenal"
            else (7 if lote.periodicidad == "Semanal" else 30)
        )
        # Fase 2: Integración de faltas reales (restringido por vigencia del contrato)
        dias_pagados = await calcular_dias_pagados(
            emp.id,
            lote.periodo_inicio,
            lote.periodo_fin,
            session,
            fecha_ingreso=emp.fecha_ingreso,
            fecha_baja=emp.fecha_baja,
        )
        if dias_pagados > Decimal(dias_periodo):
            dias_pagados = Decimal(dias_periodo)

        # 1. Base del Recibo
        sdi_calculado = calcular_sbc(emp.sueldo) if emp.sueldo else Decimal("0.00")
        nomina = Nomina(
            empleado_id=emp.id,
            lote_id=lote_id,
            fecha_inicio=lote.periodo_inicio,
            fecha_fin=lote.periodo_fin,
            periodicidad=lote.periodicidad,
            sueldo_base=emp.sueldo or Decimal("0.00"),
            dias_trabajados=dias_pagados,
            sdi=sdi_calculado,
            estado="Borrador",
        )
        session.add(nomina)
        await session.flush()  # Para obtener el ID

        perc = Decimal("0.00")
        ded = Decimal("0.00")

        # 2. P001 - Sueldo Base del Periodo
        monto_sueldo = (emp.sueldo or Decimal("0.00")) * Decimal(dias_pagados)
        session.add(
            DetalleNomina(nomina_id=nomina.id, concepto_id=c_sueldo.id, monto_aplicado=monto_sueldo)
        )
        perc += monto_sueldo

        # 3. Impuestos D001 (IMSS) y D002 (ISR)
        if monto_sueldo > 0:
            monto_imss = calcular_cuota_obrera_imss(sdi_calculado, dias_pagados, uma_actual)
            session.add(
                DetalleNomina(nomina_id=nomina.id, concepto_id=c_imss.id, monto_aplicado=monto_imss)
            )
            ded += monto_imss

            # Para ISR, mensualizamos la base
            factor_mensual = Decimal("30.4") / Decimal(dias_periodo)
            base_mensualizada = monto_sueldo * factor_mensual
            isr_mensual = calcular_isr_mensual(base_mensualizada, tabla_isr_parsed)
            isr_periodo = isr_mensual / factor_mensual
            isr_periodo = isr_periodo.quantize(Decimal("0.01"))

            session.add(
                DetalleNomina(nomina_id=nomina.id, concepto_id=c_isr.id, monto_aplicado=isr_periodo)
            )
            ded += isr_periodo

        # 4. Otras Deducciones de Empleado
        if getattr(emp, "infonavit_mensual", None) and c_infonavit:
            # Prorratear la mensualidad al periodo
            factor = Decimal(dias_periodo) / Decimal("30.4")
            monto_infonavit = emp.infonavit_mensual * factor
            monto_infonavit = monto_infonavit.quantize(Decimal("0.01"))
            session.add(
                DetalleNomina(
                    nomina_id=nomina.id, concepto_id=c_infonavit.id, monto_aplicado=monto_infonavit
                )
            )
            ded += monto_infonavit

        # 5. Totales
        nomina.subtotal_percepciones = perc
        nomina.subtotal_deducciones = ded
        nomina.neto_pagar = perc - ded
        nomina.total_pagado = perc - ded

        total_percepciones += perc
        total_deducciones += ded

    # Actualizar totales del lote
    lote.numero_empleados = len(empleados_aplicables)
    lote.total_percepciones = total_percepciones
    lote.total_deducciones = total_deducciones
    lote.total_neto = total_percepciones - total_deducciones
    lote.total_lote = lote.total_neto
    lote.estatus = "Procesado"

    await session.commit()
    await session.refresh(lote)
    return lote


@router.put("/lotes/{lote_id}/cerrar", response_model=LoteNominaResponse)
async def cerrar_lote(
    lote_id: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    res_lote = await session.execute(
        select(LoteNomina).where(LoteNomina.id == lote_id).with_for_update()
    )
    lote = res_lote.scalar_one_or_none()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    if lote.estatus != "Procesado":
        raise HTTPException(
            status_code=400, detail="Solo se puede cerrar un lote en estado Procesado"
        )
    lote.estatus = "Cerrado"
    # Marcar todas las nóminas como Pagado
    res = await session.execute(select(Nomina).where(Nomina.lote_id == lote_id))
    for n in res.scalars().all():
        if n.estado == "Borrador":
            n.estado = "Pagado"
            n.total_pagado = n.neto_pagar
    await session.commit()
    await session.refresh(lote)
    return lote


@router.post("/lotes/{lote_id}/importar", response_model=LoteNominaResponse)
async def importar_csv_lote(
    lote_id: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
    file: UploadFile = File(...),
):
    """
    Importa percepciones y deducciones desde un archivo CSV.
    Formato esperado: Empleado ID, Clave Concepto (interna o SAT), Monto
    """
    lote = await session.get(LoteNomina, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    if lote.estatus != "Procesado":
        raise HTTPException(
            status_code=400, detail="Solo se puede importar a un lote en estado Procesado"
        )

    # Leer archivo
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    # Validar headers
    if (
        not reader.fieldnames
        or "Empleado ID" not in reader.fieldnames
        or "Clave Concepto" not in reader.fieldnames
        or "Monto" not in reader.fieldnames
    ):
        raise HTTPException(
            status_code=400,
            detail="El CSV debe tener las columnas: Empleado ID, Clave Concepto, Monto",
        )

    # Obtener todas las nóminas del lote y crear un índice
    res_noms = await session.execute(
        select(Nomina).where(Nomina.lote_id == lote_id).options(selectinload(Nomina.detalles))
    )
    nominas_db: dict[int, Nomina] = {int(n.empleado_id): n for n in res_noms.scalars().all()}

    # Obtener catálogo de conceptos
    res_conceptos = await session.execute(select(ConceptoNomina))
    conceptos_db = {}
    for c in res_conceptos.scalars().all():
        conceptos_db[c.clave] = c
        conceptos_db[c.clave_sat] = c

    # Procesar filas
    updates_made = False
    for row in reader:
        try:
            emp_id = int(row["Empleado ID"])
            clave = row["Clave Concepto"].strip()
            monto = Decimal(row["Monto"].replace(",", "").strip() or "0")
        except (ValueError, KeyError, Exception):
            continue

        nomina = nominas_db.get(emp_id)
        concepto = conceptos_db.get(clave)

        if not nomina or not concepto:
            continue

        # Buscar si ya existe el detalle, si no crearlo
        detalle_existente = next((d for d in nomina.detalles if d.concepto_id == concepto.id), None)
        if detalle_existente:
            detalle_existente.monto_aplicado = monto
        else:
            nuevo_detalle = DetalleNomina(
                nomina_id=nomina.id, concepto_id=concepto.id, monto_aplicado=monto
            )
            session.add(nuevo_detalle)
            nomina.detalles.append(nuevo_detalle)

        updates_made = True

    if updates_made:
        await session.flush()
        # Recalcular totales para cada nómina actualizada
        total_perc = Decimal("0.00")
        total_ded = Decimal("0.00")

        for n in nominas_db.values():
            perc = Decimal("0.00")
            ded = Decimal("0.00")
            otros = Decimal("0.00")
            for d in n.detalles:
                c = await session.get(ConceptoNomina, d.concepto_id)
                if c:
                    if c.tipo == "Percepcion":
                        perc += d.monto_aplicado
                    elif c.tipo == "Deduccion":
                        ded += d.monto_aplicado
                    else:
                        otros += d.monto_aplicado

            n.subtotal_percepciones = perc
            n.subtotal_deducciones = ded
            n.subtotal_otros = otros
            n.neto_pagar = perc - ded + otros
            n.total_pagado = n.neto_pagar

            total_perc += perc
            total_ded += ded

        lote.total_percepciones = total_perc
        lote.total_deducciones = total_ded
        lote.total_neto = total_perc - total_ded
        lote.total_lote = lote.total_neto

        await session.commit()

    await session.refresh(lote)
    return lote


# RECIBOS INDIVIDUALES
# ═══════════════════════════════════════════════════════════════


@router.get("/recibos/{nomina_id}", response_model=NominaResponse)
async def get_recibo(
    nomina_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
):
    res = await session.execute(
        select(Nomina)
        .where(Nomina.id == nomina_id)
        .options(
            selectinload(Nomina.empleado).selectinload(Empleado.area),
            selectinload(Nomina.empleado).selectinload(Empleado.puesto),
            selectinload(Nomina.empleado).selectinload(Empleado.datos_salud),
            selectinload(Nomina.detalles).selectinload(DetalleNomina.concepto),
        )
    )
    nomina = res.scalars().first()
    if not nomina:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    if nomina.empleado_id != current_user.id:
        from app.api.deps import RequirePermission

        try:
            await RequirePermission("ver_configuracion")(session=session, current_user=current_user)
        except HTTPException:
            raise HTTPException(status_code=403, detail="No puedes ver el recibo de otro empleado.")

    return nomina


@router.put("/recibos/{nomina_id}", response_model=NominaResponse)
async def update_recibo(
    nomina_id: int,
    data: NominaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    """Actualiza un recibo y sus detalles. Recalcula los totales automáticamente."""
    res = await session.execute(
        select(Nomina).where(Nomina.id == nomina_id).options(selectinload(Nomina.detalles))
    )
    nomina = res.scalars().first()
    if not nomina:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    campos = data.model_dump(exclude_unset=True, exclude={"detalles"})
    for field, value in campos.items():
        setattr(nomina, field, value)

    if data.detalles is not None:
        # Eliminar detalles existentes y reemplazar
        for d in nomina.detalles:
            await session.delete(d)
        await session.flush()

        perc = Decimal("0.00")
        ded = Decimal("0.00")
        otros = Decimal("0.00")

        for det_data in data.detalles:
            concepto = await session.get(ConceptoNomina, det_data.concepto_id)
            if not concepto:
                continue
            detalle = DetalleNomina(
                nomina_id=nomina.id,
                concepto_id=det_data.concepto_id,
                monto_aplicado=det_data.monto_aplicado,
                descripcion_extra=det_data.descripcion_extra,
            )
            session.add(detalle)
            if concepto.tipo == "Percepcion":
                perc += det_data.monto_aplicado
            elif concepto.tipo == "Deduccion":
                ded += det_data.monto_aplicado
            else:
                otros += det_data.monto_aplicado

        nomina.subtotal_percepciones = perc
        nomina.subtotal_deducciones = ded
        nomina.subtotal_otros = otros
        nomina.neto_pagar = perc - ded + otros
        nomina.total_pagado = nomina.neto_pagar

        # Recalcular totales del lote si existe
        if nomina.lote_id:
            lote = await session.get(LoteNomina, nomina.lote_id)
            if lote:
                res_noms = await session.execute(select(Nomina).where(Nomina.lote_id == lote.id))
                noms = res_noms.scalars().all()
                lote.total_percepciones = sum(n.subtotal_percepciones for n in noms)
                lote.total_deducciones = sum(n.subtotal_deducciones for n in noms)
                lote.total_neto = lote.total_percepciones - lote.total_deducciones
                lote.total_lote = lote.total_neto

    await session.commit()

    # Recargar con relaciones para respuesta
    res2 = await session.execute(
        select(Nomina)
        .where(Nomina.id == nomina_id)
        .options(
            selectinload(Nomina.empleado).selectinload(Empleado.area),
            selectinload(Nomina.empleado).selectinload(Empleado.puesto),
            selectinload(Nomina.empleado).selectinload(Empleado.datos_salud),
            selectinload(Nomina.detalles).selectinload(DetalleNomina.concepto),
        )
    )
    return res2.scalars().first()


@router.get("/mis-recibos", response_model=List[NominaResponse])
async def get_mis_recibos(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
    limit: int = Query(12, le=50),
):
    res = await session.execute(
        select(Nomina)
        .where(Nomina.empleado_id == current_user.id)
        .options(
            selectinload(Nomina.empleado).selectinload(Empleado.area),
            selectinload(Nomina.empleado).selectinload(Empleado.puesto),
            selectinload(Nomina.empleado).selectinload(Empleado.datos_salud),
            selectinload(Nomina.detalles).selectinload(DetalleNomina.concepto),
        )
        .order_by(Nomina.fecha_fin.desc())
        .limit(limit)
    )
    return res.scalars().all()


@router.post("/recibos", response_model=NominaResponse, status_code=status.HTTP_201_CREATED)
async def create_recibo_manual(
    data: NominaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    """Crea un recibo individual (sin pertenecer a un lote, o anexo a uno)."""
    nomina = Nomina(
        empleado_id=data.empleado_id,
        lote_id=data.lote_id,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        periodicidad=data.periodicidad,
        sueldo_base=data.sueldo_base,
        dias_trabajados=data.dias_trabajados,
        sdi=data.sdi,
        factor_integracion=data.factor_integracion,
        metodo_pago=data.metodo_pago,
        observaciones=data.observaciones,
        estado="Borrador",
    )
    session.add(nomina)
    await session.flush()

    perc = Decimal("0.00")
    ded = Decimal("0.00")
    otros = Decimal("0.00")

    for det_data in data.detalles:
        concepto = await session.get(ConceptoNomina, det_data.concepto_id)
        if not concepto:
            continue
        detalle = DetalleNomina(
            nomina_id=nomina.id,
            concepto_id=det_data.concepto_id,
            monto_aplicado=det_data.monto_aplicado,
            descripcion_extra=det_data.descripcion_extra,
        )
        session.add(detalle)
        if concepto.tipo == "Percepcion":
            perc += det_data.monto_aplicado
        elif concepto.tipo == "Deduccion":
            ded += det_data.monto_aplicado
        else:
            otros += det_data.monto_aplicado

    nomina.subtotal_percepciones = perc
    nomina.subtotal_deducciones = ded
    nomina.subtotal_otros = otros
    nomina.neto_pagar = perc - ded + otros
    nomina.total_pagado = nomina.neto_pagar

    await session.commit()

    res = await session.execute(
        select(Nomina)
        .where(Nomina.id == nomina.id)
        .options(
            selectinload(Nomina.empleado),
            selectinload(Nomina.detalles).selectinload(DetalleNomina.concepto),
        )
    )
    return res.scalars().first()


# ═══════════════════════════════════════════════════════════════
# GENERACIÓN DE DOCUMENTOS
# ═══════════════════════════════════════════════════════════════


@router.get("/recibos/{nomina_id}/xml", response_model=ReciboXMLResponse)
async def get_xml_cfdi(
    nomina_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
):
    """Genera la estructura XML del CFDI de Nómina v4.0 con Complemento Nómina v1.2."""
    res = await session.execute(
        select(Nomina)
        .where(Nomina.id == nomina_id)
        .options(
            selectinload(Nomina.empleado).selectinload(Empleado.area),
            selectinload(Nomina.empleado).selectinload(Empleado.puesto),
            selectinload(Nomina.empleado).selectinload(Empleado.datos_salud),
            selectinload(Nomina.detalles).selectinload(DetalleNomina.concepto),
        )
    )
    nomina = res.scalars().first()
    if not nomina:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    if nomina.empleado_id != current_user.id:
        from app.api.deps import RequirePermission

        try:
            await RequirePermission("ver_configuracion")(session=session, current_user=current_user)
        except HTTPException:
            raise HTTPException(
                status_code=403, detail="No puedes descargar el XML de otro empleado."
            )

    emp = nomina.empleado
    percepciones = [d for d in nomina.detalles if d.concepto.tipo == "Percepcion"]
    deducciones = [d for d in nomina.detalles if d.concepto.tipo == "Deduccion"]
    otros = [d for d in nomina.detalles if d.concepto.tipo == "OtroPago"]

    total_gravado = sum(d.monto_aplicado for d in percepciones if not d.concepto.es_exento)
    total_exento = sum(d.monto_aplicado for d in percepciones if d.concepto.es_exento)

    total_impuestos = sum(d.monto_aplicado for d in deducciones if d.concepto.clave_sat == "002")
    total_otras_ded = float(nomina.subtotal_deducciones) - float(total_impuestos)

    percepciones_xml = "\n        ".join(
        [
            f'<nomina12:Percepcion TipoPercepcion="{d.concepto.clave_sat or "044"}" '
            f'Clave="{d.concepto.clave}" Concepto="{d.concepto.nombre_concepto}" '
            f'ImporteGravado="{float(d.monto_aplicado) if not d.concepto.es_exento else 0:.2f}" '
            f'ImporteExento="{float(d.monto_aplicado) if d.concepto.es_exento else 0:.2f}"/>'
            for d in percepciones
        ]
    )

    deducciones_xml = "\n        ".join(
        [
            f'<nomina12:Deduccion TipoDeduccion="{d.concepto.clave_sat or "002"}" '
            f'Clave="{d.concepto.clave}" Concepto="{d.concepto.nombre_concepto}" '
            f'Importe="{float(d.monto_aplicado):.2f}"/>'
            for d in deducciones
        ]
    )

    otros_xml = (
        "\n        ".join(
            [
                f'<nomina12:OtroPago TipoOtroPago="{d.concepto.clave_sat or "999"}" '
                f'Clave="{d.concepto.clave}" Concepto="{d.concepto.nombre_concepto}" '
                f'Importe="{float(d.monto_aplicado):.2f}"/>'
                for d in otros
            ]
        )
        if otros
        else ""
    )

    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:nomina12="http://www.sat.gob.mx/nomina12"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 cfdv40.xsd http://www.sat.gob.mx/nomina12 nomina12.xsd"
  Version="4.0"
  Serie="N"
  Folio="{nomina.id}"
  Fecha="{nomina.fecha_fin.isoformat()}T00:00:00"
  SubTotal="{float(nomina.subtotal_percepciones):.2f}"
  Descuento="{float(nomina.subtotal_deducciones):.2f}"
  Total="{float(nomina.neto_pagar):.2f}"
  Moneda="MXN"
  TipoDeComprobante="N"
  MetodoPago="PUE"
  Exportacion="01"
  FormaPago="99"
  LugarExpedicion="{emp.cp or "00000"}">

  <cfdi:Emisor
    Rfc="EKU9003173C9"
    Nombre="EMPRESA DEMO SA DE CV"
    RegimenFiscal="601"/>

  <cfdi:Receptor
    Rfc="{emp.rfc or "XAXX010101000"}"
    Nombre="{emp.nombre_completo}"
    DomicilioFiscalReceptor="{emp.cp or "00000"}"
    RegimenFiscalReceptor="605"
    UsoCFDI="CN01"/>

  <cfdi:Complemento>
    <nomina12:Nomina
      Version="1.2"
      TipoNomina="O"
      FechaPago="{nomina.fecha_fin.isoformat()}"
      FechaInicialPago="{nomina.fecha_inicio.isoformat()}"
      FechaFinalPago="{nomina.fecha_fin.isoformat()}"
      NumDiasPagados="{nomina.dias_trabajados}"
      TotalPercepciones="{float(nomina.subtotal_percepciones):.2f}"
      TotalDeducciones="{float(nomina.subtotal_deducciones):.2f}"
      {f'TotalOtrosPagos="{float(nomina.subtotal_otros):.2f}"' if float(nomina.subtotal_otros) > 0 else ""}>

      <nomina12:Receptor
        Curp="{emp.curp or ""}"
        NumSeguridadSocial="{emp.datos_salud.nss if emp and emp.datos_salud and emp.datos_salud.nss else ""}"
        FechaInicioRelLaboral="{emp.fecha_ingreso.isoformat() if emp.fecha_ingreso else ""}"
        TipoContrato="01"
        Sindicalizado="No"
        TipoJornada="01"
        TipoRegimen="02"
        NumEmpleado="{emp.id}"
        Departamento="{emp.area.nombre_area if emp.area else ""}"
        Puesto="{emp.puesto.nombre_puesto if emp.puesto else ""}"
        RiesgoPuesto="1"
        PeriodicidadPago="{ {"Semanal": "02", "Quincenal": "04", "Mensual": "05"}.get(str(nomina.periodicidad), "04") }"
        SalarioBaseCotApor="{float(nomina.sueldo_base):.2f}"
        SalarioDiarioIntegrado="{float(nomina.sdi):.6f}"
        ClaveEntFed="MEX"/>

      <nomina12:Percepciones
        TotalGravado="{total_gravado:.2f}"
        TotalExento="{total_exento:.2f}">
        {percepciones_xml}
      </nomina12:Percepciones>

      {"<nomina12:Deducciones TotalOtrosDeducciones='" + f"{total_otras_ded:.2f}'" + " TotalImpuestosRetenidos='" + f"{total_impuestos:.2f}'>" if deducciones else ""}
        {deducciones_xml}
      {"</nomina12:Deducciones>" if deducciones else ""}

      {"<nomina12:OtrosPagos>" if otros else ""}
        {otros_xml}
      {"</nomina12:OtrosPagos>" if otros else ""}

    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>"""

    # Guardar el XML en la BD
    nomina.xml_cfdi_content = xml_content
    await session.commit()

    return ReciboXMLResponse(nomina_id=nomina_id, xml_content=xml_content, uuid_sat=nomina.uuid_sat)


@router.get("/recibos/{nomina_id}/pdf", response_model=ReciboPDFResponse)
async def get_recibo_pdf(
    nomina_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
):
    """Genera el HTML del recibo de nómina listo para imprimir como PDF."""
    res = await session.execute(
        select(Nomina)
        .where(Nomina.id == nomina_id)
        .options(
            selectinload(Nomina.empleado).selectinload(Empleado.area),
            selectinload(Nomina.empleado).selectinload(Empleado.puesto),
            selectinload(Nomina.empleado).selectinload(Empleado.datos_salud),
            selectinload(Nomina.detalles).selectinload(DetalleNomina.concepto),
        )
    )
    nomina = res.scalars().first()
    if not nomina:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    if nomina.empleado_id != current_user.id:
        from app.api.deps import RequirePermission

        try:
            await RequirePermission("ver_configuracion")(session=session, current_user=current_user)
        except HTTPException:
            raise HTTPException(
                status_code=403, detail="No puedes descargar el PDF de otro empleado."
            )

    emp = nomina.empleado
    percepciones = [d for d in nomina.detalles if d.concepto.tipo == "Percepcion"]
    deducciones = [d for d in nomina.detalles if d.concepto.tipo == "Deduccion"]
    otros = [d for d in nomina.detalles if d.concepto.tipo == "OtroPago"]

    def fmt(val):
        return f"${float(val):,.2f}"

    perc_rows = "\n".join(
        [
            f"<tr><td>{d.concepto.nombre_concepto}</td><td class='amount'>{fmt(d.monto_aplicado)}</td></tr>"
            for d in percepciones
        ]
    )
    ded_rows = "\n".join(
        [
            f"<tr><td>{d.concepto.nombre_concepto}</td><td class='amount'>{fmt(d.monto_aplicado)}</td></tr>"
            for d in deducciones
        ]
    )
    otros_rows = (
        "\n".join(
            [
                f"<tr><td>{d.concepto.nombre_concepto}</td><td class='amount'>{fmt(d.monto_aplicado)}</td></tr>"
                for d in otros
            ]
        )
        if otros
        else ""
    )

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Recibo de Nómina #{nomina.id}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px; }}
  .recibo {{ max-width: 800px; margin: 0 auto; border: 2px solid #A7313A; border-radius: 8px; overflow: hidden; }}
  .header {{ background: #A7313A; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }}
  .header h1 {{ font-size: 18px; font-weight: bold; }}
  .header .periodo {{ text-align: right; font-size: 11px; }}
  .empleado-info {{ padding: 14px 20px; background: #f9f9f9; border-bottom: 1px solid #eee; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }}
  .empleado-info .field {{ margin-bottom: 4px; }}
  .empleado-info .label {{ color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }}
  .empleado-info .value {{ font-weight: 600; font-size: 11px; }}
  .conceptos {{ display: grid; grid-template-columns: 1fr 1fr; }}
  .col {{ padding: 14px 20px; }}
  .col:first-child {{ border-right: 1px solid #eee; }}
  .col h3 {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid currentColor; }}
  .col.percepciones h3 {{ color: #10B981; }}
  .col.deducciones h3 {{ color: #EF4444; }}
  .col.otros h3 {{ color: #6366F1; }}
  table {{ width: 100%; border-collapse: collapse; }}
  td {{ padding: 4px 0; border-bottom: 1px dotted #eee; }}
  td.amount {{ text-align: right; font-weight: 600; }}
  .totales {{ padding: 12px 20px; background: #f9f9f9; border-top: 2px solid #eee; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }}
  .total-item {{ text-align: center; }}
  .total-item .label {{ font-size: 9px; color: #666; text-transform: uppercase; }}
  .total-item .value {{ font-size: 14px; font-weight: bold; }}
  .total-item.neto .value {{ color: #A7313A; font-size: 18px; }}
  .footer {{ padding: 10px 20px; text-align: center; color: #999; font-size: 9px; border-top: 1px solid #eee; }}
  @media print {{ body {{ padding: 0; }} }}
</style>
</head>
<body>
<div class="recibo">
  <div class="header">
    <div>
      <h1>Recibo de Nómina</h1>
      <div style="font-size:10px;opacity:0.9">Folio #{nomina.id} • {nomina.periodicidad}</div>
    </div>
    <div class="periodo">
      <div>Período de Pago</div>
      <div style="font-size:13px;font-weight:bold">{nomina.fecha_inicio.strftime("%d/%m/%Y")} — {nomina.fecha_fin.strftime("%d/%m/%Y")}</div>
      <div>Días trabajados: {nomina.dias_trabajados}</div>
    </div>
  </div>

  <div class="empleado-info">
    <div>
      <div class="field"><div class="label">Nombre del Trabajador</div><div class="value">{emp.nombre_completo if emp else "—"}</div></div>
      <div class="field"><div class="label">RFC</div><div class="value">{emp.rfc or "—"}</div></div>
      <div class="field"><div class="label">CURP</div><div class="value">{emp.curp or "—"}</div></div>
    </div>
    <div>
      <div class="field"><div class="label">Departamento</div><div class="value">{emp.area.nombre_area if emp and emp.area else "—"}</div></div>
      <div class="field"><div class="label">Puesto</div><div class="value">{emp.puesto.nombre_puesto if emp and emp.puesto else "—"}</div></div>
      <div class="field"><div class="label">NSS</div><div class="value">{emp.datos_salud.nss if emp and emp.datos_salud and emp.datos_salud.nss else "—"}</div></div>
    </div>
  </div>

  <div class="conceptos">
    <div class="col percepciones">
      <h3>Percepciones</h3>
      <table>
        {perc_rows if perc_rows else '<tr><td colspan="2" style="color:#999;text-align:center">Sin percepciones registradas</td></tr>'}
        <tr style="font-weight:bold;border-top:2px solid #10B981">
          <td>Total Percepciones</td>
          <td class="amount" style="color:#10B981">{fmt(nomina.subtotal_percepciones)}</td>
        </tr>
      </table>
    </div>
    <div class="col deducciones">
      <h3>Deducciones</h3>
      <table>
        {ded_rows if ded_rows else '<tr><td colspan="2" style="color:#999;text-align:center">Sin deducciones registradas</td></tr>'}
        <tr style="font-weight:bold;border-top:2px solid #EF4444">
          <td>Total Deducciones</td>
          <td class="amount" style="color:#EF4444">{fmt(nomina.subtotal_deducciones)}</td>
        </tr>
      </table>
    </div>
  </div>

  {"<div class='col otros' style='padding:14px 20px;border-top:1px solid #eee'><h3>Otros Pagos</h3><table>" + otros_rows + "</table></div>" if otros_rows else ""}

  <div class="totales">
    <div class="total-item">
      <div class="label">Total Percepciones</div>
      <div class="value" style="color:#10B981">{fmt(nomina.subtotal_percepciones)}</div>
    </div>
    <div class="total-item">
      <div class="label">Total Deducciones</div>
      <div class="value" style="color:#EF4444">{fmt(nomina.subtotal_deducciones)}</div>
    </div>
    <div class="total-item neto">
      <div class="label">Neto a Pagar</div>
      <div class="value">{fmt(nomina.neto_pagar)}</div>
    </div>
  </div>

  <div class="footer">
    Recibo generado electrónicamente • SDI: {fmt(nomina.sdi)} • Factor Integración: {float(nomina.factor_integracion):.4f}
    {"• UUID SAT: " + nomina.uuid_sat if nomina.uuid_sat else "• Pendiente de timbrado por PAC"}
  </div>
</div>
</body>
</html>"""

    return ReciboPDFResponse(nomina_id=nomina_id, html_content=html)


@router.post("/lotes/{lote_id}/timbrar")
async def timbrar_lote_completo(
    lote_id: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("timbrar_nomina"))],
):
    """
    Timbra masivamente todos los recibos de un lote que estén Pagados y no timbrados.
    """
    res_lote = await session.execute(select(LoteNomina).where(LoteNomina.id == lote_id))
    lote = res_lote.scalar_one_or_none()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    if lote.estatus != "Cerrado":
        raise HTTPException(status_code=400, detail="El lote debe estar Cerrado para timbrarlo.")

    res_nominas = await session.execute(
        select(Nomina).where(
            Nomina.lote_id == lote_id, Nomina.estado == "Pagado", Nomina.estatus_sat != "Timbrado"
        )
    )
    nominas = res_nominas.scalars().all()

    if not nominas:
        raise HTTPException(
            status_code=400, detail="No hay recibos pendientes de timbrar en este lote."
        )

    exitosos = 0
    errores = []

    for nomina in nominas:
        try:
            await CFDIService.timbrar_nomina(nomina.id, session)
            exitosos += 1
        except Exception as e:
            errores.append(f"Nomina {nomina.id}: {str(e)}")

    if errores and exitosos == 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se pudo timbrar ningún recibo. Errores: {', '.join(errores)}",
        )

    return {
        "mensaje": f"{exitosos} recibos timbrados exitosamente.",
        "errores": errores if errores else None,
    }


@router.post("/recibos/{nomina_id}/timbrar")
async def timbrar_recibo(
    nomina_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("timbrar_nomina"))],
):
    """
    Timbra una nómina con el PAC simulado y genera el XML CFDI 4.0
    """
    try:
        nomina = await CFDIService.timbrar_nomina(nomina_id, session)
        return {
            "mensaje": "Nómina timbrada exitosamente",
            "uuid": nomina.uuid_sat,
            "xml_url": nomina.xml_url,
        }
    except PACException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {str(e)}")


@router.get("/recibos/{nomina_id}/xml")
async def descargar_xml_nomina(
    nomina_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_nomina"))],
):
    """
    Descarga el XML CFDI 4.0 timbrado
    """
    res = await session.execute(select(Nomina).where(Nomina.id == nomina_id))
    nomina = res.scalar_one_or_none()
    if not nomina:
        raise HTTPException(status_code=404, detail="Nómina no encontrada")
    if not nomina.xml_cfdi_content:
        raise HTTPException(
            status_code=400, detail="Esta nómina aún no ha sido timbrada o no contiene XML."
        )

    filename = (
        f"CFDI_{nomina.uuid_sat}.xml" if nomina.uuid_sat else f"CFDI_Pre_Nomina_{nomina.id}.xml"
    )
    return Response(
        content=nomina.xml_cfdi_content,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
