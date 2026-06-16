import base64
import uuid

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.empleados import Empleado
from app.models.empresa import InfoEmpresa
from app.models.nomina import DetalleNomina, Nomina


class PACException(Exception):
    pass


class CFDIService:
    @staticmethod
    async def generar_xml_nomina(nomina: Nomina, empleado: Empleado, empresa: InfoEmpresa) -> str:
        """
        Genera el XML CFDI 4.0 con Complemento de Nómina 1.2 (Simulado para ERP)
        """
        # Formatear fechas
        fecha_pago = nomina.fecha_fin.strftime("%Y-%m-%dT12:00:00")
        fecha_inicial_pago = nomina.fecha_inicio.strftime("%Y-%m-%d")
        fecha_final_pago = nomina.fecha_fin.strftime("%Y-%m-%d")
        dias_pagados = float(nomina.dias_trabajados)

        # Extraer nombre, paterno y materno del nombre completo
        partes_nombre = (
            empleado.nombre_completo.split(" ") if empleado.nombre_completo else ["Empleado"]
        )
        nombre = partes_nombre[0]
        apellido_paterno = partes_nombre[1] if len(partes_nombre) > 1 else ""
        apellido_materno = partes_nombre[2] if len(partes_nombre) > 2 else ""
        nombre_completo_cfdi = f"{nombre} {apellido_paterno} {apellido_materno}".strip()

        # Fallbacks
        cp_empresa = empresa.cp_fiscal or "00000"
        cp_empleado = empleado.cp or "00000"
        nss = empleado.numero_seguro_social or "00000000000"
        rfc_empresa = empresa.rfc or "XAXX010101000"
        rfc_empleado = empleado.rfc or "XAXX010101000"
        curp = empleado.curp or "000000000000000000"
        registro_patronal = getattr(
            empresa, "registro_patronal", "00000000000"
        )  # Si no existe, default
        razon_social = empresa.nombre or "Empresa S.A. de C.V."

        fecha_pago_cfdi = nomina.fecha_fin.strftime("%Y-%m-%d")
        fecha_ingreso = (
            empleado.fecha_ingreso.strftime("%Y-%m-%d") if empleado.fecha_ingreso else "2023-01-01"
        )

        xml = (
            f'<?xml version="1.0" encoding="utf-8"?>\n'
            f'<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" '
            f'xmlns:nomina12="http://www.sat.gob.mx/nomina12" Version="4.0" Fecha="{fecha_pago}" '
            f'Sello="[SELLO_DIGITAL]" FormaPago="99" NoCertificado="{rfc_empresa}" '
            f'Certificado="[CERTIFICADO]" SubTotal="{nomina.subtotal_percepciones}" '
            f'Descuento="{nomina.subtotal_deducciones}" Moneda="MXN" Total="{nomina.neto_pagar}" '
            f'TipoDeComprobante="N" Exportacion="01" MetodoPago="PUE" '
            f'LugarExpedicion="{cp_empresa}">\n'
            f'  <cfdi:Emisor Rfc="{rfc_empresa}" Nombre="{razon_social}" RegimenFiscal="601"/>\n'
            f'  <cfdi:Receptor Rfc="{rfc_empleado}" Nombre="{nombre_completo_cfdi}" '
            f'DomicilioFiscalReceptor="{cp_empleado}" RegimenFiscalReceptor="605" '
            f'UsoCFDI="CN01"/>\n'
            f"  <cfdi:Conceptos>\n"
            f'    <cfdi:Concepto ClaveProdServ="84111505" Cantidad="1" ClaveUnidad="ACT" '
            f'Descripcion="Pago de nómina" ValorUnitario="{nomina.subtotal_percepciones}" '
            f'Importe="{nomina.subtotal_percepciones}" '
            f'Descuento="{nomina.subtotal_deducciones}" ObjetoImp="01"/>\n'
            f"  </cfdi:Conceptos>\n"
            f"  <cfdi:Complemento>\n"
            f'    <nomina12:Nomina Version="1.2" TipoNomina="O" FechaPago="{fecha_pago_cfdi}" '
            f'FechaInicialPago="{fecha_inicial_pago}" FechaFinalPago="{fecha_final_pago}" '
            f'NumDiasPagados="{dias_pagados}">\n'
            f'      <nomina12:Emisor RegistroPatronal="{registro_patronal}"/>\n'
            f'      <nomina12:Receptor Curp="{curp}" NumSeguridadSocial="{nss}" '
            f'FechaInicioRelLaboral="{fecha_ingreso}" Antiguedad="P1Y" '
            f'TipoContrato="01" Sindicalizado="No" TipoJornada="01" TipoRegimen="02" '
            f'NumEmpleado="{empleado.id}" Departamento="{empleado.area_id or "01"}" '
            f'Puesto="{empleado.puesto_id or "01"}" RiesgoPuesto="1" PeriodicidadPago="04" '
            f'SalarioBaseCotApor="{nomina.sdi or 0.0}" '
            f'SalarioDiarioIntegrado="{nomina.sdi or 0.0}" ClaveEntFed="CMX"/>\n'
            f'      <nomina12:Percepciones TotalSueldos="{nomina.subtotal_percepciones}" '
            f'TotalGravado="{nomina.subtotal_percepciones}" TotalExento="0.00">'
        )

        # Agregar Percepciones
        for det in nomina.detalles:
            if det.concepto.tipo == "Percepcion":
                xml += (
                    f'\n        <nomina12:Percepcion TipoPercepcion="{det.concepto.clave_sat}" '
                    f'Clave="{det.concepto.clave}" Concepto="{det.concepto.nombre_concepto}" '
                    f'ImporteGravado="{det.monto_aplicado}" ImporteExento="0.00"/>'
                )

        xml += """
      </nomina12:Percepciones>"""

        if nomina.subtotal_deducciones > 0:
            total_impuestos = sum(
                d.monto_aplicado
                for d in nomina.detalles
                if d.concepto.tipo == "Deduccion" and d.concepto.clave_sat == "002"
            )
            total_otras = nomina.subtotal_deducciones - total_impuestos
            xml += (
                f'\n      <nomina12:Deducciones TotalOtrasDeducciones="{total_otras}" '
                f'TotalImpuestosRetenidos="{total_impuestos}">'
            )
            for det in nomina.detalles:
                if det.concepto.tipo == "Deduccion":
                    xml += (
                        f'\n        <nomina12:Deduccion TipoDeduccion="{det.concepto.clave_sat}" '
                        f'Clave="{det.concepto.clave}" Concepto="{det.concepto.nombre_concepto}" '
                        f'Importe="{det.monto_aplicado}"/>'
                    )
            xml += """
      </nomina12:Deducciones>"""

        xml += """
    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>"""
        return xml

    @staticmethod
    async def timbrar_nomina(nomina_id: int, session: AsyncSession):
        # 1. Obtener Nómina con detalles y empleado
        res = await session.execute(
            select(Nomina)
            .options(
                selectinload(Nomina.empleado),
                selectinload(Nomina.detalles).selectinload(DetalleNomina.concepto),
            )
            .where(Nomina.id == nomina_id)
        )
        nomina = res.scalar_one_or_none()
        if not nomina:
            raise PACException("Nómina no encontrada")

        if nomina.estatus_sat == "Timbrado":
            raise PACException("Esta nómina ya se encuentra timbrada.")

        res_empresa = await session.execute(select(InfoEmpresa))
        empresa = res_empresa.scalar_one_or_none()
        if not empresa:
            raise PACException(
                "Falta la configuración de la empresa (RFC, Razón Social) para timbrar."
            )

        # 2. Generar XML
        xml_content = await CFDIService.generar_xml_nomina(nomina, nomina.empleado, empresa)

        # 3. Llamada al PAC (Real o Simulado)
        if settings.PAC_URL and settings.PAC_USER and settings.PAC_PASSWORD:
            # Flujo Producción Real
            try:
                # Ejemplo genérico de consumo de API de PAC
                # Esto variará dependiendo del proveedor exacto
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        settings.PAC_URL,
                        auth=(settings.PAC_USER, settings.PAC_PASSWORD),
                        json={"xml_base64": base64.b64encode(xml_content.encode()).decode()},
                    )
                    if response.status_code != 200:
                        raise PACException(f"Error del PAC: {response.text}")

                    data = response.json()
                    simulated_uuid = data.get("uuid")
                    simulated_sello = data.get("sello")

                    nomina.uuid_sat = simulated_uuid
                    nomina.sello_sat = simulated_sello
                    nomina.xml_cfdi_content = xml_content.replace(
                        "[SELLO_DIGITAL]", simulated_sello
                    ).replace("[CERTIFICADO]", "CERT_PRODUCCION")
                    nomina.estatus_sat = "Timbrado"
                    nomina.estado = "Pagado"
            except Exception as e:
                raise PACException(f"Falla de conexión con PAC real: {str(e)}")
        elif str(settings.PAC_TEST_MODE).lower() in ("true", "1", "yes"):
            # Flujo Simulado Local
            simulated_uuid = str(uuid.uuid4()).upper()
            simulated_sello = base64.b64encode(simulated_uuid.encode()).decode()
            nomina.uuid_sat = simulated_uuid
            nomina.sello_sat = simulated_sello
            nomina.xml_cfdi_content = xml_content.replace(
                "[SELLO_DIGITAL]", simulated_sello
            ).replace("[CERTIFICADO]", "CERT_SIMULADO_1234567890")
            nomina.estatus_sat = "Timbrado"
            nomina.estado = "Pagado"
        else:
            # ERP sin proveedor contratado (Modo Pre-nómina)
            # Solo genera el XML para que el usuario lo timbre por fuera.
            nomina.xml_cfdi_content = xml_content.replace("[SELLO_DIGITAL]", "").replace(
                "[CERTIFICADO]", ""
            )
            nomina.estatus_sat = "Generado"

        # Opcional: Generar URL local para descargar el XML (o devolverlo)
        nomina.xml_url = f"/api/nomina/recibos/{nomina_id}/xml"
        nomina.pdf_url = f"/api/nomina/recibos/{nomina_id}/pdf"

        await session.commit()
        return nomina
