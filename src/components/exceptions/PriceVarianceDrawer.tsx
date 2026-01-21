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
  Phone,
  Edit,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

export default function PriceVarianceDrawer({
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

  // Get related documents
  const relatedDocs = documents.filter((doc) =>
    group.exceptions.some((ex) => ex.document_id === doc.id)
  );

  // Mock price variance data - in production this would come from line items
  const priceComparison = {
    po_unit_price: 125.0,
    invoice_unit_price: 142.5,
    variance_percent: 14.0,
    allowed_tolerance: 5.0,
    result: "Fail",
    line_item: "Industrial Steel Brackets - SKU: ISB-2024",
  };

  const slaStatus = group.sla_status || "At Risk";
  const totalImpact = group.total_impact || 12450;

  const handleDocumentClick = (docId) => {
    router.push(createPageUrl("DocumentViewer") + `?id=${docId}`);
    onOpenChange(false);
  };

  const handleOverrideWithJustification = async () => {
    if (!overrideReason.trim()) {
      toast.error("Override reason is required");
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
          notes: `Price variance overridden: ${overrideReason}`,
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
          notes: "Price variance escalated to AP Manager",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Escalated to AP Manager");
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
              Price Variance
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
                What is a Price Variance?
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">
                  A price variance occurs when the invoiced unit price or total
                  amount exceeds the purchase order price beyond the configured
                  tolerance (e.g. ±5%). This indicates potential supplier
                  pricing changes, contract deviations, or data entry errors
                  requiring review before payment approval.
                </p>
              </div>
            </div>

            <Separator />

            {/* Section 2: Evidence & Breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Price Comparison
              </h3>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3">
                        Field
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-700 px-4 py-3">
                        Value
                      </th>
                      <th className="text-center text-xs font-semibold text-slate-700 px-4 py-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="text-sm text-slate-700 px-4 py-3">
                        PO Unit Price
                      </td>
                      <td className="text-sm text-slate-900 font-medium px-4 py-3 text-right">
                        ${priceComparison.po_unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm text-slate-700 px-4 py-3">
                        Invoice Unit Price
                      </td>
                      <td className="text-sm text-rose-700 font-semibold px-4 py-3 text-right">
                        ${priceComparison.invoice_unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <XCircle className="w-4 h-4 text-rose-600 inline-block" />
                      </td>
                    </tr>
                    <tr className="bg-rose-50">
                      <td className="text-sm font-semibold text-slate-900 px-4 py-3">
                        Variance %
                      </td>
                      <td className="text-sm text-rose-700 font-bold px-4 py-3 text-right">
                        +{priceComparison.variance_percent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className="bg-rose-100 text-rose-700 border-rose-300"
                        >
                          Exceeds Limit
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-sm text-slate-700 px-4 py-3">
                        Allowed Tolerance
                      </td>
                      <td className="text-sm text-slate-900 font-medium px-4 py-3 text-right">
                        ±{priceComparison.allowed_tolerance.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-slate-500">Policy</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Line Item Detail */}
              <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-1">
                  Affected Line Item:
                </p>
                <p className="text-sm text-slate-900">
                  {priceComparison.line_item}
                </p>
              </div>
            </div>

            <Separator />

            {/* Section 3: Impacted Documents */}
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
                          Supplier implemented price increase without PO
                          amendment
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          Contract renegotiation completed but PO not updated in
                          system
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>
                          Invoice data entry error or mismatched unit of measure
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

            {/* Section 5: System Recommendations */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Recommended Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() =>
                    toast.info("Supplier contact workflow initiated")
                  }
                >
                  <Phone className="w-4 h-4 mr-3 text-slate-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Contact Supplier to Verify Pricing
                    </div>
                    <div className="text-xs text-slate-500">
                      Confirm price change authorization
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => toast.info("PO update workflow initiated")}
                >
                  <Edit className="w-4 h-4 mr-3 text-slate-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Update PO (if contract allows)
                    </div>
                    <div className="text-xs text-slate-500">
                      Amend purchase order to reflect new pricing
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => toast.info("Credit note request initiated")}
                >
                  <FileDown className="w-4 h-4 mr-3 text-slate-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Request Credit Note
                    </div>
                    <div className="text-xs text-slate-500">
                      Request supplier adjustment for overcharge
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Section 6: Financial & SLA Impact */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Financial & SLA Impact
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
                    <Clock className="w-4 h-4 text-rose-600" />
                    <p className="text-xs text-slate-500">Payment Status</p>
                  </div>
                  <p className="text-sm font-semibold text-rose-700">Blocked</p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-900">
                  <strong>Impact Notice:</strong> Unresolved price variances
                  block payment and delay month-end close. Resolution required
                  before payment run execution.
                </p>
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

        {/* Section 7: Resolution Actions (Fixed Footer) */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <Button
            className="w-full bg-slate-900 hover:bg-slate-800"
            onClick={() => handleDocumentClick(relatedDocs[0]?.id)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Review in Document Viewer
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
