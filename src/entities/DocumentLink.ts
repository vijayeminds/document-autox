{
  "name": "DocumentLink",
  "type": "object",
  "properties": {
    "source_document_id": {
      "type": "string",
      "description": "Source document ID"
    },
    "target_document_id": {
      "type": "string",
      "description": "Target document ID"
    },
    "link_type": {
      "type": "string",
      "enum": [
        "PO_ASN",
        "ASN_BOL",
        "BOL_POD",
        "POD_Invoice",
        "PO_Invoice"
      ],
      "description": "Type of link between documents"
    },
    "match_confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "mismatch_reason": {
      "type": "string",
      "description": "Reason for mismatch if confidence is low"
    },
    "status": {
      "type": "string",
      "enum": [
        "Matched",
        "Partial",
        "Mismatch",
        "Pending"
      ],
      "default": "Pending"
    }
  },
  "required": [
    "source_document_id",
    "target_document_id",
    "link_type"
  ]
}