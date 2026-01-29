"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentViewer() {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [poMatchData, setPoMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setDocumentId(urlParams.get("id"));
    }
  }, []);

  useEffect(() => {
    if (!documentId) return;
    const fetchDocument = async () => {
      try {
        const { data } = await axiosInstance.get(
          `/api/v1/invoice/${documentId}`,
        );
        setInvoice(data.data);

        try {
          const poResponse = await axiosInstance.get(
            `/api/v1/invoice/po-match/${documentId}`,
          );
          if (poResponse.data?.data) {
            setPoMatchData(poResponse.data.data);
          }
        } catch (err) {
          console.log("No PO match data available");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-lg font-medium">Document not found</p>
        </div>
      </div>
    );
  }

  // Determine if we should show 4 columns (Match to Orders) or 2 columns (Review Needed)
  const isMatchToOrders =
    invoice.status === "match_to_orders" ||
    invoice.status === "matched" ||
    poMatchData?.po_data;
  const columns = isMatchToOrders ? 4 : 2;

  // Handler functions for edit mode
  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(JSON.parse(JSON.stringify(invoice.extracted_json))); // Deep copy
    // Initialize default labels if not already set
    if (Object.keys(fieldLabels).length === 0) {
      setFieldLabels({
        "supplier.name": "Name",
        "supplier.address": "Address",
        "supplier.gst_or_tax_id": "Tax ID",
        "supplier.contact": "Contact",
        "invoice_metadata.invoice_id": "Invoice ID",
        po_number: "PO Number",
        "invoice_metadata.invoice_date": "Invoice Date",
        "invoice_metadata.due_date": "Due Date",
        "summary.subtotal": "Subtotal",
        "summary.taxes": "Taxes",
        "summary.shipping_charges": "Shipping",
        "summary.grand_total": "Grand Total",
      });
    }
  };

  const handleLabelChange = (key: string, newLabel: string) => {
    setFieldLabels((prev) => ({
      ...prev,
      [key]: newLabel,
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update the invoice with edited data
      await axiosInstance.put(`/api/v1/invoice/${documentId}`, {
        extracted_json: editedData,
      });

      // Update local state
      setInvoice({
        ...invoice,
        extracted_json: editedData,
      });

      setIsEditing(false);
      setEditedData(null);
      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (path: (string | number)[], value: any) => {
    const newData = JSON.parse(JSON.stringify(editedData));
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setEditedData(newData);
  };

  // Get display data (edited or original)
  const displayData = isEditing ? editedData : invoice.extracted_json;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Invoice {invoice.po_id}</h1>
            <p className="text-sm text-slate-600">
              {invoice.extracted_json?.supplier?.name || "Unknown Supplier"}
            </p>
          </div>
        </div>

        {/* Action Buttons - Conditional based on state */}
        <div className="flex items-center gap-3">
          {isMatchToOrders ? (
            // Match to Orders state: Show Approve, Needs Review, Exception
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => console.log("Approved")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log("Needs Review")}
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
              >
                Needs Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log("Exception")}
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Exception
              </Button>
            </>
          ) : (
            // Review Needed state: Show Edit/Save/Cancel
            <>
              {!isEditing ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="border-slate-600 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className={`flex-1 grid ${isMatchToOrders ? "grid-cols-4" : "grid-cols-2"} gap-4 p-6 overflow-hidden`}
      >
        {/* Column 1: PDF Document */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white flex flex-col">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
            <h3 className="font-semibold text-sm">Document</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            {invoice.file_url?.endsWith(".pdf") ? (
              <iframe
                src={`/api/proxy-pdf?url=${encodeURIComponent(invoice.file_url)}`}
                className="w-full h-full"
                title="PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No PDF available
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Extracted Invoice Data - COMPLETE */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white flex flex-col">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
            <h3 className="font-semibold text-sm">Extracted Invoice Data</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {/* Supplier Info */}
            <div className="mb-4">
              <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                Supplier
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={fieldLabels["supplier.name"] || "Name"}
                      onChange={(e) =>
                        handleLabelChange("supplier.name", e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-20">
                      {fieldLabels["supplier.name"] || "Name"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData?.supplier?.name || ""}
                      onChange={(e) =>
                        handleFieldChange(["supplier", "name"], e.target.value)
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.supplier?.name || "N/A"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={fieldLabels["supplier.address"] || "Address"}
                      onChange={(e) =>
                        handleLabelChange("supplier.address", e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-20">
                      {fieldLabels["supplier.address"] || "Address"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData?.supplier?.address || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          ["supplier", "address"],
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.supplier?.address || "N/A"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={fieldLabels["supplier.gst_or_tax_id"] || "Tax ID"}
                      onChange={(e) =>
                        handleLabelChange(
                          "supplier.gst_or_tax_id",
                          e.target.value,
                        )
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-20">
                      {fieldLabels["supplier.gst_or_tax_id"] || "Tax ID"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData?.supplier?.gst_or_tax_id || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          ["supplier", "gst_or_tax_id"],
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.supplier?.gst_or_tax_id || "N/A"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={fieldLabels["supplier.contact"] || "Contact"}
                      onChange={(e) =>
                        handleLabelChange("supplier.contact", e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-20">
                      {fieldLabels["supplier.contact"] || "Contact"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData?.supplier?.contact || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          ["supplier", "contact"],
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.supplier?.contact || "N/A"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Metadata */}
            <div className="mb-4">
              <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                Invoice Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={
                        fieldLabels["invoice_metadata.invoice_id"] ||
                        "Invoice ID"
                      }
                      onChange={(e) =>
                        handleLabelChange(
                          "invoice_metadata.invoice_id",
                          e.target.value,
                        )
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-24">
                      {fieldLabels["invoice_metadata.invoice_id"] ||
                        "Invoice ID"}
                      :
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={
                        displayData?.invoice_metadata?.invoice_id ||
                        invoice.po_id
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          ["invoice_metadata", "invoice_id"],
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.invoice_metadata?.invoice_id ||
                        invoice.po_id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={fieldLabels["po_number"] || "PO Number"}
                      onChange={(e) =>
                        handleLabelChange("po_number", e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-24">
                      {fieldLabels["po_number"] || "PO Number"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData?.po_number || ""}
                      onChange={(e) =>
                        handleFieldChange(["po_number"], e.target.value)
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.po_number || "N/A"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={
                        fieldLabels["invoice_metadata.invoice_date"] ||
                        "Invoice Date"
                      }
                      onChange={(e) =>
                        handleLabelChange(
                          "invoice_metadata.invoice_date",
                          e.target.value,
                        )
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-24">
                      {fieldLabels["invoice_metadata.invoice_date"] ||
                        "Invoice Date"}
                      :
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="date"
                      value={displayData?.invoice_metadata?.invoice_date || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          ["invoice_metadata", "invoice_date"],
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.invoice_metadata?.invoice_date || "N/A"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={
                        fieldLabels["invoice_metadata.due_date"] || "Due Date"
                      }
                      onChange={(e) =>
                        handleLabelChange(
                          "invoice_metadata.due_date",
                          e.target.value,
                        )
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-24">
                      {fieldLabels["invoice_metadata.due_date"] || "Due Date"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="date"
                      value={displayData?.invoice_metadata?.due_date || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          ["invoice_metadata", "due_date"],
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  ) : (
                    <span className="font-medium">
                      {displayData?.invoice_metadata?.due_date || "N/A"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            {displayData?.items && displayData.items.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                  Line Items ({displayData.items.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-50">
                        <th className="text-left p-2 font-semibold text-slate-700">
                          Description
                        </th>
                        <th className="text-left p-2 font-semibold text-slate-700">
                          SKU
                        </th>
                        <th className="text-right p-2 font-semibold text-slate-700">
                          Qty
                        </th>
                        <th className="text-right p-2 font-semibold text-slate-700">
                          Unit Price
                        </th>
                        <th className="text-right p-2 font-semibold text-slate-700">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.items.map((item: any, idx: number) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="p-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.description || ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    ["items", idx, "description"],
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            ) : (
                              item.description || `Item ${idx + 1}`
                            )}
                          </td>
                          <td className="p-2 text-slate-600">
                            {isEditing ? (
                              <input
                                type="text"
                                value={item.sku || ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    ["items", idx, "sku"],
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-0.5 border border-slate-300 rounded text-xs"
                              />
                            ) : (
                              item.sku || "N/A"
                            )}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) =>
                                  handleFieldChange(
                                    ["items", idx, "quantity"],
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full px-1 py-0.5 border border-slate-300 rounded text-xs text-right"
                              />
                            ) : (
                              item.quantity || 0
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price || 0}
                                onChange={(e) =>
                                  handleFieldChange(
                                    ["items", idx, "unit_price"],
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full px-1 py-0.5 border border-slate-300 rounded text-xs text-right"
                              />
                            ) : (
                              `$${item.unit_price?.toLocaleString() || 0}`
                            )}
                          </td>
                          <td className="p-2 text-right font-semibold">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={item.total_amount || 0}
                                onChange={(e) =>
                                  handleFieldChange(
                                    ["items", idx, "total_amount"],
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full px-1 py-0.5 border border-slate-300 rounded text-xs text-right"
                              />
                            ) : (
                              `$${item.total_amount?.toLocaleString() || 0}`
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-4">
              <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                Summary
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={fieldLabels["summary.subtotal"] || "Subtotal"}
                      onChange={(e) =>
                        handleLabelChange("summary.subtotal", e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-20">
                      {fieldLabels["summary.subtotal"] || "Subtotal"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={displayData?.summary?.subtotal || 0}
                      onChange={(e) =>
                        handleFieldChange(
                          ["summary", "subtotal"],
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      ${displayData?.summary?.subtotal?.toLocaleString() || "0"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={fieldLabels["summary.taxes"] || "Taxes"}
                      onChange={(e) =>
                        handleLabelChange("summary.taxes", e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-20">
                      {fieldLabels["summary.taxes"] || "Taxes"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={displayData?.summary?.taxes || 0}
                      onChange={(e) =>
                        handleFieldChange(
                          ["summary", "taxes"],
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      ${displayData?.summary?.taxes?.toLocaleString() || "0"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={
                        fieldLabels["summary.shipping_charges"] || "Shipping"
                      }
                      onChange={(e) =>
                        handleLabelChange(
                          "summary.shipping_charges",
                          e.target.value,
                        )
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="text-slate-600 w-20">
                      {fieldLabels["summary.shipping_charges"] || "Shipping"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={displayData?.summary?.shipping_charges || 0}
                      onChange={(e) =>
                        handleFieldChange(
                          ["summary", "shipping_charges"],
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-medium">
                      $
                      {displayData?.summary?.shipping_charges?.toLocaleString() ||
                        "0"}
                    </span>
                  )}
                </div>
                <div className="pt-1 border-t border-slate-300 flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={
                        fieldLabels["summary.grand_total"] || "Grand Total"
                      }
                      onChange={(e) =>
                        handleLabelChange("summary.grand_total", e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-slate-600 bg-slate-50 font-semibold"
                      placeholder="Label"
                    />
                  ) : (
                    <span className="font-semibold w-20">
                      {fieldLabels["summary.grand_total"] || "Grand Total"}:
                    </span>
                  )}
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={displayData?.summary?.grand_total || 0}
                      onChange={(e) =>
                        handleFieldChange(
                          ["summary", "grand_total"],
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                      placeholder="Value"
                    />
                  ) : (
                    <span className="font-bold">
                      $
                      {displayData?.summary?.grand_total?.toLocaleString() ||
                        "0"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Scores */}
            {invoice.validation_result && (
              <div className="mb-4">
                <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                  Validation Scores
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="border border-slate-200 p-2 rounded text-center">
                    <div className="text-slate-600">PO Number</div>
                    <div className="font-bold">
                      {invoice.validation_result.po_number || 0}%
                    </div>
                  </div>
                  <div className="border border-slate-200 p-2 rounded text-center">
                    <div className="text-slate-600">Supplier</div>
                    <div className="font-bold">
                      {invoice.validation_result.supplier || 0}%
                    </div>
                  </div>
                  <div className="border border-slate-200 p-2 rounded text-center">
                    <div className="text-slate-600">Totals</div>
                    <div className="font-bold">
                      {invoice.validation_result.totals_accuracy || 0}%
                    </div>
                  </div>
                  <div className="border border-slate-200 p-2 rounded text-center">
                    <div className="text-slate-600">Dates</div>
                    <div className="font-bold">
                      {invoice.validation_result.dates_accuracy || 0}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 3 & 4: Only show in Match to Orders state */}
        {isMatchToOrders && (
          <>
            {/* Column 3: PO Data - COMPLETE */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white flex flex-col">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
                <h3 className="font-semibold text-sm">Purchase Order Data</h3>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {poMatchData?.po_data ? (
                  <>
                    {/* PO Details */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                        PO Details
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-slate-600">PO Number:</span>{" "}
                          <span className="font-medium">
                            {poMatchData.po_data.po_number || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Date:</span>{" "}
                          <span className="font-medium">
                            {poMatchData.po_data.date || "N/A"}
                          </span>
                        </div>
                        {poMatchData.po_data.supplier && (
                          <>
                            <div>
                              <span className="text-slate-600">Supplier:</span>{" "}
                              <span className="font-medium">
                                {poMatchData.po_data.supplier.name || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-600">Tax ID:</span>{" "}
                              <span className="font-medium">
                                {poMatchData.po_data.supplier.tax_id || "N/A"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* PO Line Items */}
                    {poMatchData.po_data.items &&
                      poMatchData.po_data.items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                            PO Line Items ({poMatchData.po_data.items.length})
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-300 bg-slate-50">
                                  <th className="text-left p-2 font-semibold text-slate-700">
                                    Description
                                  </th>
                                  <th className="text-left p-2 font-semibold text-slate-700">
                                    SKU
                                  </th>
                                  <th className="text-right p-2 font-semibold text-slate-700">
                                    Qty
                                  </th>
                                  <th className="text-right p-2 font-semibold text-slate-700">
                                    Unit Price
                                  </th>
                                  <th className="text-right p-2 font-semibold text-slate-700">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {poMatchData.po_data.items.map(
                                  (item: any, idx: number) => (
                                    <tr
                                      key={idx}
                                      className="border-b border-slate-200 hover:bg-slate-50"
                                    >
                                      <td className="p-2">
                                        {item.description || `Item ${idx + 1}`}
                                      </td>
                                      <td className="p-2 text-slate-600">
                                        {item.sku || "N/A"}
                                      </td>
                                      <td className="p-2 text-right font-medium">
                                        {item.quantity || 0}
                                      </td>
                                      <td className="p-2 text-right">
                                        $
                                        {item.unit_price?.toLocaleString() || 0}
                                      </td>
                                      <td className="p-2 text-right font-semibold">
                                        $
                                        {item.line_total?.toLocaleString() || 0}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    {/* PO Summary */}
                    {poMatchData.po_data.summary && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                          PO Summary
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-slate-600">Subtotal:</span>{" "}
                            <span className="font-medium">
                              $
                              {poMatchData.po_data.summary.subtotal?.toLocaleString() ||
                                "0"}
                            </span>
                          </div>
                          <div className="pt-1 border-t border-slate-300">
                            <span className="font-semibold">Total:</span>{" "}
                            <span className="font-bold">
                              $
                              {poMatchData.po_data.summary.total_amount_due?.toLocaleString() ||
                                "0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Match Scores */}
                    {poMatchData.match_field_score && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                          Match Scores
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="border border-slate-200 p-2 rounded text-center">
                            <div className="text-slate-600">PO Number</div>
                            <div className="font-bold">
                              {poMatchData.match_field_score.po_number || 0}%
                            </div>
                          </div>
                          <div className="border border-slate-200 p-2 rounded text-center">
                            <div className="text-slate-600">Supplier</div>
                            <div className="font-bold">
                              {poMatchData.match_field_score.supplier || 0}%
                            </div>
                          </div>
                          <div className="border border-slate-200 p-2 rounded text-center">
                            <div className="text-slate-600">Totals</div>
                            <div className="font-bold">
                              {poMatchData.match_field_score.totals_accuracy ||
                                0}
                              %
                            </div>
                          </div>
                          <div className="border border-slate-200 p-2 rounded text-center">
                            <div className="text-slate-600">Dates</div>
                            <div className="font-bold">
                              {poMatchData.match_field_score.dates_accuracy ||
                                0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">No PO data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: Receipt Data - COMPLETE - Only show if receipt exists */}
            {poMatchData?.receipt ? (
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white flex flex-col">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
                  <h3 className="font-semibold text-sm">Receipt Data</h3>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {/* Receipt Details */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                      Receipt Details
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="text-slate-600">PO Number:</span>{" "}
                        <span className="font-medium">
                          {poMatchData.receipt.po_number || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">Date:</span>{" "}
                        <span className="font-medium">
                          {poMatchData.receipt.date || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Line Items */}
                  {poMatchData.receipt.items &&
                    poMatchData.receipt.items.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                          Receipt Line Items ({poMatchData.receipt.items.length}
                          )
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-300 bg-slate-50">
                                <th className="text-left p-2 font-semibold text-slate-700">
                                  Description
                                </th>
                                <th className="text-left p-2 font-semibold text-slate-700">
                                  SKU
                                </th>
                                <th className="text-right p-2 font-semibold text-slate-700">
                                  Qty
                                </th>
                                <th className="text-right p-2 font-semibold text-slate-700">
                                  Unit Price
                                </th>
                                <th className="text-right p-2 font-semibold text-slate-700">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {poMatchData.receipt.items.map(
                                (item: any, idx: number) => (
                                  <tr
                                    key={idx}
                                    className="border-b border-slate-200 hover:bg-slate-50"
                                  >
                                    <td className="p-2">
                                      {item.description || `Item ${idx + 1}`}
                                    </td>
                                    <td className="p-2 text-slate-600">
                                      {item.sku || "N/A"}
                                    </td>
                                    <td className="p-2 text-right font-medium">
                                      {item.quantity || 0}
                                    </td>
                                    <td className="p-2 text-right">
                                      ${item.unit_price?.toLocaleString() || 0}
                                    </td>
                                    <td className="p-2 text-right font-semibold">
                                      ${item.line_total?.toLocaleString() || 0}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Receipt Summary */}
                  {poMatchData.receipt.summary && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                        Receipt Summary
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="pt-1 border-t border-slate-300">
                          <span className="font-semibold">Total:</span>{" "}
                          <span className="font-bold">
                            $
                            {poMatchData.receipt.summary.total_amount_due?.toLocaleString() ||
                              "0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Receipt Match Score */}
                  {poMatchData.match_field_score?.receipt_accuracy !==
                    undefined && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-xs uppercase text-slate-600 mb-2">
                        Receipt Match
                      </h4>
                      <div className="border border-slate-200 p-2 rounded text-center text-xs">
                        <div className="text-slate-600">Receipt Accuracy</div>
                        <div className="font-bold">
                          {poMatchData.match_field_score.receipt_accuracy}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white flex flex-col">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
                  <h3 className="font-semibold text-sm">Receipt Data</h3>
                </div>
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">No receipt data</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
