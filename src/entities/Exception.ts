{
  "name": "Exception",
  "type": "object",
  "properties": {
    "document_id": {
      "type": "string",
      "description": "Related document ID"
    },
    "exception_type": {
      "type": "string",
      "enum": [
        "Price Variance",
        "Shortage",
        "Missing POD",
        "Delay",
        "Duplicate",
        "Missing Data",
        "Vendor Mismatch"
      ],
      "description": "Type of exception"
    },
    "severity": {
      "type": "string",
      "enum": [
        "Low",
        "Medium",
        "High"
      ],
      "default": "Medium"
    },
    "description": {
      "type": "string",
      "description": "Exception details"
    },
    "recommended_action": {
      "type": "string",
      "description": "AI-recommended resolution"
    },
    "status": {
      "type": "string",
      "enum": [
        "Open",
        "In Review",
        "Resolved",
        "Escalated"
      ],
      "default": "Open"
    },
    "assigned_to": {
      "type": "string",
      "description": "Assigned user email"
    },
    "resolution_notes": {
      "type": "string"
    },
    "resolved_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "document_id",
    "exception_type",
    "severity"
  ]
}