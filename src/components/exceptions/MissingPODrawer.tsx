import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  FileText,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Send,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function MissingPODrawer({
  open,
  onOpenChange,
  group,
  documents,
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  if (!group) return null;

  const relatedDocs = documents.filter((doc) =>
    group.exceptions.some((ex) => ex.document_id === doc.id)
  );

  const primaryDoc = relatedDocs[0] || {};
  const totalImpact = group.total_impact || 18200;
  const slaStatus = group.sla_status || "At Risk";

  // Determine severity based on amount
  const severity = totalImpact > 10000 ? "High" : "Medium";

  // Mock detection evidence - in production this would come from the exception data
  const detectionEvidence = {
    extracted_po_number: primaryDoc.reference_number
      ? "None detected"
      : "INV-2024-8293",
    vendor_name: primaryDoc.vendor || "Unknown Vendor",
    spend_category: "Professional Services",
    policy_rule: "PO mandatory above $5,000",
    invoice_amount: totalImpact,
  };

  const handleDocumentClick = (docId) => {
    router.push(createPageUrl("DocumentViewer") + `?id=${docId}`);
    onOpenChange(false);
  };

  const handleRequestPO = async () => {
    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "In Review",
          assigned_to: "requester@company.com",
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Reviewed",
          notes: "PO request sent to requester",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("PO request sent to requester");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to send PO request");
    }
  };

  const handleConvertToNonPO = async () => {
    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "In Review",
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Reviewed",
          notes: "Converted to non-PO approval flow",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Converted to non-PO approval workflow");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to convert workflow");
    }
  };

  const handleRejectInvoice = async () => {
    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: "Invoice rejected - Missing PO",
          resolved_at: new Date().toISOString(),
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Rejected",
          notes: "Invoice rejected and returned to supplier",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Invoice rejected and returned to supplier");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reject invoice");
    }
  };

  const handleOverrideWithJustification = async () => {
    if (!overrideReason.trim() || overrideReason.length < 20) {
      toast.error("Override reason must be at least 20 characters");
      return;
    }

    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: `Override: ${overrideReason}`,
          resolved_at: new Date().toISOString(),
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Override",
          notes: `Missing PO overridden: ${overrideReason}`,
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Exception overridden and logged");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to override exception");
    }
  };

  const handleEscalate = async () => {
    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Escalated",
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Escalated",
          notes: "Missing PO escalated to procurement",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Escalated to procurement");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to escalate");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] overflow-hidden flex flex-col">
        {/* Header */}
        <SheetHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-xl font-semibold text-slate-900">
              Missing Purchase Order
            </SheetTitle>
            <Badge
              variant="outline"
              className={
                severity === "High"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              {severity} Severity
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`${
                slaStatus === "Breached"
                  ? "bg-rose-100 text-rose-700 border-rose-300"
                  : slaStatus === "At Risk"
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-emerald-100 text-emerald-700 border-emerald-300"
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {slaStatus}
            </Badge>
            <span className="text-sm text-slate-600">
              ${totalImpact.toLocaleString()} at risk across{" "}
              {group.document_count} document
              {group.document_count !== 1 ? "s" : ""}
            </span>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-6">
            {/* Section 1: Exception Definition */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                What is a Missing PO?
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">
                  This invoice does not reference a valid purchase order.
                  Company policy requires a PO for this spend category.
                  Processing without a PO increases compliance risk and may
                  indicate procurement bypass.
                </p>
              </div>
            </div>

            <Separator />

            {/* Section 2: Detection Evidence */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Detection Evidence
              </h3>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3 w-1/3">
                        Extracted PO Number
                      </td>
                      <td className="text-sm text-slate-900 px-4 py-3">
                        <Badge
                          variant="outline"
                          className="bg-slate-100 text-slate-700"
                        >
                          {detectionEvidence.extracted_po_number}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3">
                        Vendor Name
                      </td>
                      <td className="text-sm text-slate-900 px-4 py-3">
                        {detectionEvidence.vendor_name}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3">
                        Spend Category
                      </td>
                      <td className="text-sm text-slate-900 px-4 py-3">
                        {detectionEvidence.spend_category}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3">
                        Invoice Amount
                      </td>
                      <td className="text-sm font-semibold text-slate-900 px-4 py-3">
                        ${detectionEvidence.invoice_amount.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-rose-50">
                      <td className="text-sm font-medium text-slate-900 px-4 py-3">
                        Policy Rule Triggered
                      </td>
                      <td className="text-sm font-semibold text-rose-700 px-4 py-3">
                        {detectionEvidence.policy_rule}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Section 3: Root Cause Analysis */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Root Cause Analysis
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3 mb-3">
                  <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Likely Causes:
                    </p>
                    <ul className="space-y-1.5 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          Supplier submitted invoice without referencing
                          purchase order number
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          Requester bypassed procurement process (maverick
                          spend)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          PO created after invoice submission or receipt
                          timestamp mismatch
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                  <Badge
                    variant="outline"
                    className="bg-white text-blue-700 border-blue-300 text-xs"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Detection Confidence: High
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 4: Recommended Actions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Recommended Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={handleRequestPO}
                >
                  <Send className="w-4 h-4 mr-3 text-slate-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Request PO from Requester
                    </div>
                    <div className="text-xs text-slate-500">
                      Send notification to business owner for PO creation
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={handleConvertToNonPO}
                >
                  <RefreshCw className="w-4 h-4 mr-3 text-slate-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Convert to Non-PO Approval Flow
                    </div>
                    <div className="text-xs text-slate-500">
                      Route to exception approval workflow with manager sign-off
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-rose-200 hover:bg-rose-50"
                  onClick={handleRejectInvoice}
                >
                  <X className="w-4 h-4 mr-3 text-rose-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-rose-700">
                      Reject Invoice to Supplier
                    </div>
                    <div className="text-xs text-slate-500">
                      Return invoice with PO requirement notice
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Section 5: Impact */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Impact
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <p className="text-xs text-slate-500">Total Exposure</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    ${totalImpact.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-rose-200">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <p className="text-xs text-slate-500">Payment Status</p>
                  </div>
                  <p className="text-sm font-semibold text-rose-700">Blocked</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mb-3">
                <p className="text-xs text-amber-900 mb-2">
                  <strong>SLA Risk:</strong> Invoice processing is suspended
                  until PO is provided or exception approval is obtained. This
                  may impact payment terms and supplier relationships.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-700">
                  <strong>Audit Note:</strong> Invoices without PO increase
                  compliance risk and reduce spend visibility. Missing POs may
                  indicate procurement policy violations requiring
                  investigation.
                </p>
              </div>
            </div>

            {/* Impacted Documents */}
            <Separator />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Impacted Documents
              </h3>
              <div className="space-y-2">
                {relatedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc.id)}
                    className="w-full bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">
                            {doc.reference_number || doc.id}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {doc.document_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{doc.vendor}</p>
                        {doc.total_amount && (
                          <p className="text-xs font-medium text-slate-700 mt-1">
                            ${doc.total_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Override Section (conditional) */}
            {showOverride && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Override with Justification
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label
                        htmlFor="override-reason"
                        className="text-xs font-medium text-slate-700"
                      >
                        Mandatory Justification (Audit Trail)
                      </Label>
                      <Textarea
                        id="override-reason"
                        placeholder="Enter detailed justification for override (minimum 20 characters)..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowOverride(false);
                          setOverrideReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={handleOverrideWithJustification}
                        disabled={overrideReason.length < 20}
                      >
                        Confirm Override
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Resolution Actions (Fixed Footer) */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800"
            onClick={() => handleDocumentClick(relatedDocs[0]?.id)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Review Invoice
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleEscalate}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Escalate
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowOverride(true)}
              disabled={showOverride}
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Override
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
