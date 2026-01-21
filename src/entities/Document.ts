{
  "name": "Document",
  "type": "object",
  "properties": {
    "document_type": {
      "type": "string",
      "enum": [
        "Invoice",
        "PO",
        "ASN",
        "BOL",
        "POD"
      ],
      "description": "Type of document"
    },
    "source": {
      "type": "string",
      "enum": [
        "Email",
        "API",
        "Upload"
      ],
      "description": "How the document was received"
    },
    "vendor": {
      "type": "string",
      "description": "Vendor name"
    },
    "status": {
      "type": "string",
      "enum": [
        "Received",
        "Processing",
        "Needs Review",
        "Linked",
        "Exception"
      ],
      "default": "Received",
      "description": "Current processing status"
    },
    "confidence_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "AI confidence score (0-100)"
    },
    "file_url": {
      "type": "string",
      "description": "URL to the document file"
    },
    "total_amount": {
      "type": "number",
      "description": "Total document amount"
    },
    "currency": {
      "type": "string",
      "default": "USD"
    },
    "reference_number": {
      "type": "string",
      "description": "Document reference/invoice number"
    },
    "document_date": {
      "type": "string",
      "format": "date"
    }
  },
  "required": [
    "document_type",
    "vendor",
    "status"
  ]
}