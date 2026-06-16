import json
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, event, text
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm.attributes import get_history

from app.core.context import current_user_id_var


class Base(DeclarativeBase):
    pass


class AuditoriaMixin:
    """Mixin para agregar fechas de auditoría y borrado lógico."""

    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    creado_por_id = Column(Integer, nullable=True)
    actualizado_por_id = Column(Integer, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)


@event.listens_for(AuditoriaMixin, "before_insert", propagate=True)
def receive_before_insert(mapper, connection, target):
    user_id = current_user_id_var.get()
    if user_id is not None:
        target.creado_por_id = user_id
        target.actualizado_por_id = user_id


@event.listens_for(AuditoriaMixin, "before_update", propagate=True)
def receive_before_update(mapper, connection, target):
    user_id = current_user_id_var.get()
    if user_id is not None:
        target.actualizado_por_id = user_id


def _record_audit(connection, target, mapper, action):
    user_id = current_user_id_var.get()

    cambios = {}
    if action == "UPDATE":
        for col in mapper.columns:
            if col.name in ["actualizado_en"]:
                continue
            history = get_history(target, col.name)
            if history.has_changes():
                # Obtenemos los valores antes y después
                old_val = history.deleted[0] if history.deleted else None
                new_val = history.added[0] if history.added else None
                cambios[col.name] = {"old": old_val, "new": new_val}
    elif action == "INSERT":
        for col in mapper.columns:
            val = getattr(target, col.name, None)
            if val is not None:
                cambios[col.name] = {"new": val}
    elif action == "DELETE":
        for col in mapper.columns:
            val = getattr(target, col.name, None)
            if val is not None:
                cambios[col.name] = {"old": val}

    if not cambios and action == "UPDATE":
        return

    try:
        cambios_json = json.dumps(cambios, default=str)
    except Exception:
        cambios_json = "{}"

    stmt = text("""
        INSERT INTO auditoria_logs 
            (tabla_afectada, registro_id, accion, cambios, realizado_por_id, creado_en)
        VALUES (:tabla, :reg_id, :accion, :cambios, :uid, :ahora)
    """)
    connection.execute(
        stmt,
        {
            "tabla": mapper.local_table.name,
            "reg_id": str(getattr(target, "id", 0)),
            "accion": action,
            "cambios": cambios_json,
            "uid": user_id,
            "ahora": datetime.utcnow(),
        },
    )


@event.listens_for(AuditoriaMixin, "after_insert", propagate=True)
def receive_after_insert(mapper, connection, target):
    _record_audit(connection, target, mapper, "INSERT")


@event.listens_for(AuditoriaMixin, "after_update", propagate=True)
def receive_after_update(mapper, connection, target):
    _record_audit(connection, target, mapper, "UPDATE")


@event.listens_for(AuditoriaMixin, "after_delete", propagate=True)
def receive_after_delete(mapper, connection, target):
    _record_audit(connection, target, mapper, "DELETE")
