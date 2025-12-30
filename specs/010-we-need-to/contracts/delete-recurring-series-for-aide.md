# API Contract: Delete Recurring Series for Aide

## DELETE /api/assignments/{id}/recurring-series-for-aide

Delete this assignment and all future assignments in the same recurring series for the same aide.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Assignment ID to start deletion from |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| preview | boolean | No | false | If true, return count without deleting |

### Request Body

```json
{
  "version": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version | integer | Yes | Current assignment version for optimistic locking |

### Response (200 OK)

```json
{
  "deleted_count": 4,
  "deleted_ids": [101, 102, 103, 104],
  "skipped_count": 1,
  "skipped_reason": "1 modified assignment(s) preserved",
  "message": "Removed 4 recurring instance(s) for this aide"
}
```

### Response (200 OK - Preview Mode)

```json
{
  "preview": true,
  "would_delete_count": 4,
  "would_delete_ids": [101, 102, 103, 104],
  "would_skip_count": 1,
  "would_skip_reason": "1 modified assignment(s) would be preserved"
}
```

### Error Responses

#### 400 Bad Request - Missing Version
```json
{
  "error": "version is required"
}
```

#### 400 Bad Request - Not Part of Recurring Series
```json
{
  "error": "Assignment is not part of a recurring series"
}
```

#### 404 Not Found
```json
{
  "error": "Assignment not found"
}
```

#### 409 Conflict - Version Mismatch
```json
{
  "error": "Assignment was modified by another user",
  "current_version": 2,
  "your_version": 1
}
```

---

## Example Usage

### Preview (get count before deletion)

**Request:**
```http
DELETE /api/assignments/101/recurring-series-for-aide?preview=true
Content-Type: application/json

{
  "version": 1
}
```

**Response:**
```json
{
  "preview": true,
  "would_delete_count": 4,
  "would_delete_ids": [101, 102, 103, 104],
  "would_skip_count": 0,
  "would_skip_reason": null
}
```

### Execute Deletion

**Request:**
```http
DELETE /api/assignments/101/recurring-series-for-aide
Content-Type: application/json

{
  "version": 1
}
```

**Response:**
```json
{
  "deleted_count": 4,
  "deleted_ids": [101, 102, 103, 104],
  "skipped_count": 0,
  "skipped_reason": null,
  "message": "Removed 4 recurring instance(s) for this aide"
}
```

---

## Behavior Notes

1. **Aide Determination**: The target aide is determined from the assignment's `aide_id`. If the assignment is in Relief Pool (`aide_id = NULL`), use `original_aide_id`.

2. **Date Filtering**: Only assignments on or after the selected assignment's date are included. Past assignments are preserved.

3. **Modification Detection**: Assignments whose `start_time` or `end_time` differ from the `recurring_series` template are skipped.

4. **Relief Pool Inclusion**: Assignments in the Relief Pool with matching `original_aide_id` are included in deletion.

5. **Transaction Safety**: All deletions happen in a single transaction. On failure, none are deleted.

6. **Task Preservation**: The underlying Task template is never deleted by this operation.

