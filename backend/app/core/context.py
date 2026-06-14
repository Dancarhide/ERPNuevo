import contextvars
from typing import Optional

current_user_id_var: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar(
    "current_user_id", default=None
)
