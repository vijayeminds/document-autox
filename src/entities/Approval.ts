{
  "name": "Approval",
  "type": "object",
  "properties": {
    "document_id": {
      "type": "string",
      "description": "Related document ID"
    },
    "approver": {
      "type": "string",
      "description": "Approver email"
    },
    "decision": {
      "type": "string",
      "enum": [
        "Pending",
        "Approved",
        "Rejected",
        "Override"
      ],
      "default": "Pending"
    },
    "rationale": {
      "type": "string",
      "description": "Reason for decision"
    },
    "decision_timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "approval_type": {
      "type": "string",
      "enum": [
        "Standard",
        "Exception",
        "Override",
        "Escalation"
      ],
      "default": "Standard"
    },
    "amount_threshold": {
      "type": "number",
      "description": "Amount that triggered approval"
    }
  },
  "required": [
    "document_id"
  ]
}