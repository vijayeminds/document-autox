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
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  FileText,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function DuplicateInvoiceDrawer({
  open,
  onOpenChange,
  group,
  documents,
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!group) return null;

  const relatedDocs = documents.filter((doc) =>
    group.exceptions.some((ex) => ex.document_id === doc.id)
  );

  const totalImpact = group.total_impact || 12450;

  // Mock duplicate comparison data - in production this would come from detection algorithm
  const duplicateComparison = {
    original: {
      id: relatedDocs[0]?.id || "INV-2024-0123",
      invoice_number: "INV-456789",
      date: "2024-12-15",
      amount: 12450.0,
      vendor: relatedDocs[0]?.vendor || "Acme Supplies Inc.",
      status: "Paid",
      payment_date: "2024-12-20",
    },
    duplicate: {
      id: relatedDocs[1]?.id || "INV-2024-0124",
      invoice_number: "INV-456789",
      date: "2024-12-15",
      amount: 12450.0,
      vendor: relatedDocs[0]?.vendor || "Acme Supplies Inc.",
      status: "Pending",
      payment_date: null,
    },
    confidence: 98,
    match_criteria: ["Invoice Number", "Vendor", "Amount", "Date"],
  };

  const handleDocumentClick = (docId) => {
    router.push(createPageUrl("DocumentViewer") + `?id=${docId}`);
    onOpenChange(false);
  };

  const handleRejectDuplicate = async () => {
    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: "Duplicate invoice rejected",
          resolved_at: new Date().toISOString(),
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Rejected",
          notes: "Duplicate invoice rejected - original already processed",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Duplicate invoice rejected");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reject duplicate");
    }
  };

  const handleLinkAsReference = async () => {
    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: "Linked as reference to original invoice",
          resolved_at: new Date().toISOString(),
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Linked",
          notes: "Duplicate invoice linked to original for audit trail",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Linked as reference document");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to link document");
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
          notes: "Duplicate invoice escalated for manual review",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Escalated for manual review");
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
              Duplicate Invoice Detected
            </SheetTitle>
            <Badge
              variant="outline"
              className="bg-rose-100 text-rose-800 border-rose-300"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              High Severity
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-rose-700">
              Duplicate payment risk: ${totalImpact.toLocaleString()}
            </span>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-6">
            {/* Section 1: Exception Definition */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                What is a Duplicate Invoice?
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">
                  This invoice appears to be a duplicate of a previously
                  submitted invoice. Processing this invoice would result in
                  duplicate payment to the vendor. The system detected matching
                  invoice numbers, amounts, and vendor details with high
                  confidence.
                </p>
              </div>
            </div>

            <Separator />

            {/* Section 2: Duplicate Evidence */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Duplicate Evidence
              </h3>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3 w-1/3">
                        Field
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3">
                        Original Invoice
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3">
                        Current Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3">
                        Invoice Number
                      </td>
                      <td className="text-sm text-slate-900 px-4 py-3">
                        {duplicateComparison.original.invoice_number}
                      </td>
                      <td className="text-sm text-rose-700 font-semibold px-4 py-3">
                        {duplicateComparison.duplicate.invoice_number}
                        {duplicateComparison.original.invoice_number ===
                          duplicateComparison.duplicate.invoice_number && (
                          <CheckCircle2 className="w-3 h-3 inline-block ml-2 text-rose-600" />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3">
                        Date
                      </td>
                      <td className="text-sm text-slate-900 px-4 py-3">
                        {duplicateComparison.original.date}
                      </td>
                      <td className="text-sm text-rose-700 font-semibold px-4 py-3">
                        {duplicateComparison.duplicate.date}
                        {duplicateComparison.original.date ===
                          duplicateComparison.duplicate.date && (
                          <CheckCircle2 className="w-3 h-3 inline-block ml-2 text-rose-600" />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3">
                        Amount
                      </td>
                      <td className="text-sm text-slate-900 px-4 py-3">
                        ${duplicateComparison.original.amount.toLocaleString()}
                      </td>
                      <td className="text-sm text-rose-700 font-semibold px-4 py-3">
                        ${duplicateComparison.duplicate.amount.toLocaleString()}
                        {duplicateComparison.original.amount ===
                          duplicateComparison.duplicate.amount && (
                          <CheckCircle2 className="w-3 h-3 inline-block ml-2 text-rose-600" />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm font-medium text-slate-700 px-4 py-3">
                        Vendor
                      </td>
                      <td className="text-sm text-slate-900 px-4 py-3">
                        {duplicateComparison.original.vendor}
                      </td>
                      <td className="text-sm text-rose-700 font-semibold px-4 py-3">
                        {duplicateComparison.duplicate.vendor}
                        {duplicateComparison.original.vendor ===
                          duplicateComparison.duplicate.vendor && (
                          <CheckCircle2 className="w-3 h-3 inline-block ml-2 text-rose-600" />
                        )}
                      </td>
                    </tr>
                    <tr className="bg-rose-50">
                      <td className="text-sm font-semibold text-slate-900 px-4 py-3">
                        Match Confidence
                      </td>
                      <td colSpan={2} className="text-sm px-4 py-3">
                        <Badge
                          variant="outline"
                          className="bg-rose-100 text-rose-700 border-rose-300"
                        >
                          {duplicateComparison.confidence}% Match
                        </Badge>
                        <span className="text-xs text-slate-600 ml-2">
                          Matched on:{" "}
                          {duplicateComparison.match_criteria.join(", ")}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Section 3: Matched Records */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Matched Records
              </h3>
              <div className="space-y-2">
                {/* Original Invoice */}
                <button
                  onClick={() =>
                    handleDocumentClick(duplicateComparison.original.id)
                  }
                  className="w-full bg-emerald-50 rounded-lg border border-emerald-200 p-3 hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-900">
                          Original Invoice
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs"
                        >
                          {duplicateComparison.original.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        {duplicateComparison.original.invoice_number} •{" "}
                        {duplicateComparison.original.vendor}
                      </p>
                      <p className="text-xs font-medium text-slate-700 mt-1">
                        ${duplicateComparison.original.amount.toLocaleString()}{" "}
                        • Paid on {duplicateComparison.original.payment_date}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </button>

                {/* Duplicate Invoice */}
                <button
                  onClick={() =>
                    handleDocumentClick(duplicateComparison.duplicate.id)
                  }
                  className="w-full bg-rose-50 rounded-lg border border-rose-200 p-3 hover:border-rose-300 hover:shadow-sm transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <span className="text-sm font-medium text-slate-900">
                          Duplicate Invoice (Current)
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-rose-100 text-rose-700 border-rose-300 text-xs"
                        >
                          {duplicateComparison.duplicate.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        {duplicateComparison.duplicate.invoice_number} •{" "}
                        {duplicateComparison.duplicate.vendor}
                      </p>
                      <p className="text-xs font-medium text-slate-700 mt-1">
                        ${duplicateComparison.duplicate.amount.toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            {/* Section 4: Root Cause Analysis */}
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
                          Supplier accidentally resubmitted invoice after
                          initial payment
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          Invoice sent via multiple channels (email, portal,
                          EDI)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          OCR duplicate detection identified matching document
                          fingerprint
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
                    Detection Confidence: {duplicateComparison.confidence}%
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 5: Recommended Actions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Recommended Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-rose-200 hover:bg-rose-50"
                  onClick={handleRejectDuplicate}
                >
                  <X className="w-4 h-4 mr-3 text-rose-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-rose-700">
                      Reject Duplicate
                    </div>
                    <div className="text-xs text-slate-500">
                      Mark as duplicate and prevent payment
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={handleLinkAsReference}
                >
                  <LinkIcon className="w-4 h-4 mr-3 text-slate-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Link as Reference</div>
                    <div className="text-xs text-slate-500">
                      Keep for audit trail but do not process
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={handleEscalate}
                >
                  <TrendingUp className="w-4 h-4 mr-3 text-slate-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Escalate for Review
                    </div>
                    <div className="text-xs text-slate-500">
                      Send to AP Manager for manual verification
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Section 6: Impact */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Impact
              </h3>

              <div className="bg-rose-50 rounded-lg p-4 border border-rose-200 mb-3">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-rose-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-rose-900 mb-1">
                      Overpayment Risk
                    </p>
                    <p className="text-sm text-rose-800">
                      Processing this duplicate invoice would result in
                      overpayment of{" "}
                      <strong>${totalImpact.toLocaleString()}</strong> to the
                      vendor. The original invoice has already been paid.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Audit Warning
                    </p>
                    <p className="text-xs text-amber-800">
                      Duplicate payments are a key audit concern and may
                      indicate control weaknesses. All duplicate detections must
                      be documented and resolved before month-end close.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Resolution Actions (Fixed Footer) */}
        <div className="border-t border-slate-200 pt-4">
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800"
            onClick={() => handleDocumentClick(duplicateComparison.original.id)}
          >
            <FileText className="w-4 h-4 mr-2" />
            View Original Invoice
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
