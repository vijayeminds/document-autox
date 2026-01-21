import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ExtractedFields({
  document,
  lineItems,
  selectedHighlightId,
  onFieldClick,
  onFieldUpdate,
  onLineItemUpdate,
}) {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editedFields, setEditedFields] = useState({});

  const handleStartEdit = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setEditValue(currentValue || "");
  };

  const handleSaveEdit = (fieldName) => {
    onFieldUpdate(fieldName, editValue);
    setEditedFields((prev) => ({ ...prev, [fieldName]: true }));
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const fields = [
    {
      id: "vendor_name",
      label: "Seller / Vendor",
      value: "X Construction",
      confidence: 98,
    },
    {
      id: "invoice_no",
      label: "Invoice No",
      value: "#CON-2028-001",
      confidence: 99,
    },
    {
      id: "invoice_date",
      label: "Invoice Date",
      value: "September 21, 2028",
      confidence: 99,
    },
    { id: "bill_to", label: "Bill To", value: "ABC Company", confidence: 97 },
    {
      id: "subtotal",
      label: "Subtotal",
      value: 26000,
      confidence: 99,
      type: "number",
    },
    {
      id: "tax",
      label: "Tax (10%)",
      value: 2600,
      confidence: 99,
      type: "number",
    },
    {
      id: "grand_total",
      label: "Grand Total",
      value: 28600,
      confidence: 99,
      type: "number",
    },
  ];

  const getStatusIcon = (confidence) => {
    if (confidence >= 85) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-amber-600" />;
  };

  const getStatusText = (confidence, fieldId) => {
    if (editedFields[fieldId]) return "User Verified";
    if (confidence >= 85) return "Matched";
    return "Needs Review";
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Extracted Fields
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Click any field to highlight on document
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Header Fields */}
        <div className="p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Header Information
          </h3>

          {fields.map((field) => {
            const isActive = selectedHighlightId === field.id;
            const isEditing = editingField === field.id;
            const needsReview = field.confidence < 85;
            const isUserVerified = editedFields[field.id];

            return (
              <button
                key={field.id}
                onClick={() => !isEditing && onFieldClick(field.id)}
                className={`w-full text-left transition-all rounded-lg border p-3 group ${
                  isActive
                    ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300/50"
                    : needsReview
                    ? "border-amber-200 bg-amber-50/50"
                    : isUserVerified
                    ? "border-blue-200 bg-blue-50/30"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-600">
                        {field.label}
                      </span>
                      {getStatusIcon(field.confidence)}
                      <span
                        className={`text-xs ${
                          isUserVerified
                            ? "text-blue-700 font-medium"
                            : needsReview
                            ? "text-amber-700 font-medium"
                            : "text-emerald-700"
                        }`}
                      >
                        {getStatusText(field.confidence, field.id)}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type={field.type || "text"}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(field.id);
                          }}
                          className="h-8 px-2"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="h-8 px-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {field.type === "number" && field.value
                            ? `$${field.value.toLocaleString()}`
                            : field.value || "N/A"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(field.id, field.value);
                          }}
                          className="h-6 px-2 opacity-0 group-hover:opacity-100 hover:bg-slate-100"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500">
                      {field.confidence}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Line Items */}
        <div className="border-t border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Line Items
          </h3>

          <div className="space-y-2">
            {lineItems.map((item, index) => {
              const highlightId = `line_item_${index}`;
              const isActive = selectedHighlightId === highlightId;
              const needsReview = item.confidence_score < 85;

              return (
                <button
                  key={item.id || index}
                  onClick={() => onFieldClick(highlightId)}
                  className={`w-full text-left transition-all rounded-lg border p-3 ${
                    isActive
                      ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300/50"
                      : needsReview
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        Line {index + 1}
                      </span>
                      {getStatusIcon(item.confidence_score)}
                      <span
                        className={`text-xs ${
                          needsReview
                            ? "text-amber-700 font-medium"
                            : "text-emerald-700"
                        }`}
                      >
                        {getStatusText(item.confidence_score)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {item.confidence_score}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">SKU:</span>
                      <span className="ml-1 font-medium text-slate-900">
                        {item.sku || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Qty:</span>
                      <span className="ml-1 font-medium text-slate-900">
                        {item.quantity || 0}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Description:</span>
                      <span className="ml-1 font-medium text-slate-900">
                        {item.description}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Unit Price:</span>
                      <span className="ml-1 font-medium text-slate-900">
                        ${item.unit_price?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total:</span>
                      <span className="ml-1 font-semibold text-slate-900">
                        ${item.total_price?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
