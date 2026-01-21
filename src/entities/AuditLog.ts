{
  "name": "AuditLog",
  "type": "object",
  "properties": {
    "entity_type": {
      "type": "string",
      "enum": [
        "Document",
        "LineItem",
        "Exception",
        "Approval",
        "Link"
      ],
      "description": "Type of entity affected"
    },
    "entity_id": {
      "type": "string",
      "description": "ID of the affected entity"
    },
    "action": {
      "type": "string",
      "enum": [
        "Created",
        "Updated",
        "Deleted",
        "Approved",
        "Rejected",
        "Escalated",
        "Reviewed",
        "Linked",
        "Unlinked"
      ],
      "description": "Action performed"
    },
    "performed_by": {
      "type": "string",
      "description": "User who performed the action"
    },
    "notes": {
      "type": "string",
      "description": "Additional context"
    },
    "previous_value": {
      "type": "string",
      "description": "Value before change (JSON)"
    },
    "new_value": {
      "type": "string",
      "description": "Value after change (JSON)"
    }
  },
  "required": [
    "entity_type",
    "entity_id",
    "action"
  ]
}