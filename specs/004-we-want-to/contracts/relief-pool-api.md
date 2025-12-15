# API Contract: Relief Pool

**Feature**: Relief Pool - Absent Aide Task Reassignment  
**Date**: 2025-12-03  
**Base URL**: `/api`

## Overview

This document defines the REST API contracts for the Relief Pool feature. All endpoints follow the existing API patterns established in the codebase.

---

## New Endpoints

### GET /relief-pool

Retrieve all Relief Pool tasks, grouped by date.

**Request**
```http
GET /api/relief-pool
```

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string (ISO) | No | Filter to specific date |
| `include_expired` | boolean | No | Include tasks past their end time (default: false) |

**Response: 200 OK**
```json
{
  "tasks": [
    {
      "id": 123,
      "task_id": 45,
      "date": "2025-12-03",
      "start_time": "09:10:00",
      "end_time": "09:40:00",
      "status": "RELIEF_POOL",
      "original_aide_id": 7,
      "version": 2,
      "task": {
        "id": 45,
        "title": "Reading Support",
        "category": "CLASS_SUPPORT",
        "classroom_id": 12,
        "notes": "Focus on phonics"
      },
      "original_aide": {
        "id": 7,
        "name": "John Smith"
      },
      "classroom": {
        "id": 12,
        "name": "Grade 3A",
        "room_number": "101"
      }
    }
  ],
  "by_date": {
    "2025-12-03": [123, 124],
    "2025-12-04": [125]
  },
  "total_count": 3
}
```

**Response: 500 Internal Server Error**
```json
{
  "error": "Database error occurred"
}
```

---

### GET /relief-pool/count

Get the count of pending Relief Pool tasks (for badge display).

**Request**
```http
GET /api/relief-pool/count
```

**Response: 200 OK**
```json
{
  "count": 5,
  "by_date": {
    "2025-12-03": 3,
    "2025-12-04": 2
  }
}
```

---

### POST /relief-pool/{id}/reassign

Reassign a Relief Pool task to a new aide.

**Request**
```http
POST /api/relief-pool/123/reassign
Content-Type: application/json

{
  "aide_id": 8,
  "start_time": "09:10:00",
  "end_time": "09:40:00",
  "version": 2
}
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `aide_id` | integer | Yes | ID of the aide to assign |
| `start_time` | string (HH:MM:SS) | No | New start time (default: original) |
| `end_time` | string (HH:MM:SS) | No | New end time (default: original) |
| `version` | integer | Yes | Current version for optimistic locking |

**Response: 200 OK**
```json
{
  "id": 123,
  "task_id": 45,
  "aide_id": 8,
  "date": "2025-12-03",
  "start_time": "09:10:00",
  "end_time": "09:40:00",
  "status": "ASSIGNED",
  "original_aide_id": null,
  "version": 3
}
```

**Response: 400 Bad Request**
```json
{
  "error": "aide_id is required"
}
```

**Response: 403 Forbidden (Date Restriction)**
```json
{
  "error": "Relief Pool tasks can only be assigned on their original date (2025-12-03)",
  "original_date": "2025-12-03"
}
```

**Response: 404 Not Found**
```json
{
  "error": "Assignment not found or not in Relief Pool"
}
```

**Response: 409 Conflict (Time Collision)**
```json
{
  "error": "Time slot conflict with existing assignment",
  "conflict": {
    "id": 456,
    "task_id": 78,
    "start_time": "09:00:00",
    "end_time": "09:30:00"
  }
}
```

**Response: 409 Conflict (Version Mismatch)**
```json
{
  "error": "Assignment was modified by another user",
  "current_version": 3,
  "your_version": 2
}
```

---

### POST /relief-pool/{id}/dismiss

Dismiss a Relief Pool task (mark as not needing coverage).

**Request**
```http
POST /api/relief-pool/123/dismiss
Content-Type: application/json

{
  "reason": "Class cancelled for assembly",
  "version": 2
}
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | No | Optional reason for dismissal |
| `version` | integer | Yes | Current version for optimistic locking |

**Response: 200 OK**
```json
{
  "id": 123,
  "status": "dismissed",
  "message": "Task removed from Relief Pool"
}
```

**Response: 404 Not Found**
```json
{
  "error": "Assignment not found or not in Relief Pool"
}
```

---

## Modified Endpoints

### POST /absences (Modified)

**Change**: Cascade now creates Relief Pool entries instead of unassigning.

**Existing Request** (unchanged)
```http
POST /api/absences
Content-Type: application/json

{
  "aide_id": 7,
  "date": "2025-12-03",
  "reason": "Sick leave"
}
```

**Modified Response: 201 Created**
```json
{
  "id": 1,
  "aide_id": 7,
  "date": "2025-12-03",
  "reason": "Sick leave",
  "relief_pool_tasks": [
    {
      "id": 123,
      "task_id": 45,
      "start_time": "09:10:00",
      "end_time": "09:40:00",
      "status": "RELIEF_POOL"
    },
    {
      "id": 124,
      "task_id": 46,
      "start_time": "10:00:00",
      "end_time": "10:30:00",
      "status": "RELIEF_POOL"
    }
  ],
  "relief_pool_count": 2
}
```

**Note**: The `released_assignments` field is renamed to `relief_pool_tasks` and tasks now have status `RELIEF_POOL` instead of `UNASSIGNED`.

---

### DELETE /absences/{id} (Modified)

**Change**: Now attempts to restore Relief Pool tasks to the original aide.

**Existing Request** (unchanged)
```http
DELETE /api/absences/1
```

**Modified Response: 200 OK** (changed from 204 No Content)
```json
{
  "message": "Absence removed",
  "restored_tasks": [
    {
      "id": 123,
      "task_id": 45,
      "aide_id": 7,
      "status": "ASSIGNED"
    }
  ],
  "conflict_tasks": [
    {
      "id": 124,
      "task_id": 46,
      "reason": "Time slot now occupied",
      "conflict_with": {
        "id": 456,
        "aide_id": 7,
        "start_time": "10:00:00"
      }
    }
  ],
  "restored_count": 1,
  "conflict_count": 1
}
```

---

## Error Response Format

All error responses follow this structure:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DATE_RESTRICTION` | 403 | Relief Pool date rule violated |
| `TIME_CONFLICT` | 409 | Time slot collision |
| `VERSION_CONFLICT` | 409 | Optimistic locking failure |
| `INVALID_STATUS` | 400 | Task not in Relief Pool |

---

## Contract Test Scenarios

### GET /relief-pool

1. **Empty Relief Pool**: Returns empty array when no tasks in pool
2. **Multiple dates**: Returns tasks grouped by date correctly
3. **Date filter**: Filtering by date returns only that date's tasks
4. **Includes relationships**: Task, original_aide, and classroom are populated

### POST /relief-pool/{id}/reassign

1. **Success**: Task moves from RELIEF_POOL to ASSIGNED status
2. **Date restriction**: Returns 403 when target date differs from original
3. **Time conflict**: Returns 409 with conflict details
4. **Version conflict**: Returns 409 when version is stale
5. **Invalid aide**: Returns 400 when aide_id doesn't exist
6. **Time adjustment**: New times are validated and applied

### POST /relief-pool/{id}/dismiss

1. **Success**: Task is removed from database
2. **Not in Relief Pool**: Returns 404 for non-Relief Pool tasks

### POST /absences (Modified)

1. **Creates Relief Pool**: Tasks move to RELIEF_POOL instead of UNASSIGNED
2. **Preserves original_aide_id**: Original aide is stored
3. **Returns count**: Response includes relief_pool_count

### DELETE /absences/{id} (Modified)

1. **Restores tasks**: Available slots are restored to original aide
2. **Reports conflicts**: Occupied slots are reported, tasks stay in Relief Pool
3. **Partial restore**: Mix of restored and conflicting is handled

---

## Rate Limits

No additional rate limits for Relief Pool endpoints. Standard API limits apply.

## Versioning

These endpoints are part of API v1 and follow the existing versioning scheme.

---

*API contracts complete. Ready for test scenario definition.*











