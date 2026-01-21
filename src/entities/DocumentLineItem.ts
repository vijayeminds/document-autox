{
  "name": "DocumentLineItem",
  "type": "object",
  "properties": {
    "document_id": {
      "type": "string",
      "description": "Reference to parent document"
    },
    "sku": {
      "type": "string",
      "description": "Product SKU"
    },
    "description": {
      "type": "string",
      "description": "Line item description"
    },
    "quantity": {
      "type": "number",
      "description": "Quantity"
    },
    "unit_price": {
      "type": "number",
      "description": "Price per unit"
    },
    "total_price": {
      "type": "number",
      "description": "Total line price"
    },
    "confidence_score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "flagged": {
      "type": "boolean",
      "default": false,
      "description": "Whether this line item needs review"
    },
    "flag_reason": {
      "type": "string",
      "description": "Reason for flagging"
    }
  },
  "required": [
    "document_id",
    "description"
  ]
}