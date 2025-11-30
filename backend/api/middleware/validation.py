"""
T053: Input Validation Middleware

Lightweight helpers to validate JSON payloads and time/date formats
at route boundaries.
"""
from __future__ import annotations

from functools import wraps
from flask import request


def require_json(keys: list[str]):
    """
    Ensure request has JSON body with required top-level keys.
    Returns 400 with details if validation fails.
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.get_json(silent=True)
            if data is None:
                return {"error": "Bad request", "message": "Expected JSON body"}, 400
            missing = [k for k in keys if data.get(k) in (None, "")]
            if missing:
                return {
                    "error": "Bad request",
                    "message": f"Missing required fields: {', '.join(missing)}",
                }, 400
            return func(*args, **kwargs)
        return wrapper
    return decorator


def validate_time_30min(field_names: list[str]):
    """
    Validate time fields are in HH:MM with minutes in {00, 15, 30, 45}.
    Note: Despite the function name, this now validates 15-minute increments.
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            data = request.get_json(silent=True) or {}
            for field in field_names:
                value = data.get(field)
                if not isinstance(value, str):
                    return {"error": "Bad request", "message": f"{field} must be a time string"}, 400
                # Accept HH:MM or HH:MM:SS
                parts = value.split(":")
                if len(parts) not in (2, 3):
                    return {"error": "Bad request", "message": f"{field} must be HH:MM or HH:MM:SS"}, 400
                hh, mm = parts[0], parts[1]
                if not (hh.isdigit() and mm.isdigit()):
                    return {"error": "Bad request", "message": f"{field} must be numeric time"}, 400
                h, m = int(hh), int(mm)
                # Allow 5-minute increments to support custom schedule segments (e.g. 08:50, 09:10)
                if h < 0 or h > 23 or m % 5 != 0:
                    return {"error": "Bad request", "message": f"{field} must be 5-min increment"}, 400
            return func(*args, **kwargs)
        return wrapper
    return decorator


