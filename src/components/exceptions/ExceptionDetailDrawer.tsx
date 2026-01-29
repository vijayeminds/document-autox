import React from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Clock,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const severityConfig = {
  High: {
    color: "bg-rose-100 text-rose-800 border-rose-300",
    icon: AlertTriangle,
  },
  Medium: {
    color: "bg-amber-100 text-amber-800 border-amber-300",
    icon: AlertTriangle,
  },
  Low: {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: AlertTriangle,
  },
};

export default function ExceptionDetailDrawer({
  open,
  onOpenChange,
  group,
  documents,
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!group) return null;

  const severityStyle = severityConfig[group.severity] || severityConfig.Medium;
  const SeverityIcon = severityStyle.icon;

  // Get related documents
  const relatedDocs = documents.filter((doc) =>
    group.exceptions.some((ex) => ex.document_id === doc.id)
  );

  const handleResolveAll = async () => {
    try {
      // Resolve all exceptions in this group
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: "Bulk resolved via exception triage",
          resolved_at: new Date().toISOString(),
        });

        // Create audit log
        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Reviewed",
          notes: `Exception group resolved: ${group.exception_type}`,
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success(`Resolved ${group.document_count} exceptions`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to resolve exceptions");
    }
  };

  const handleEscalate = async () => {
    try {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Escalated",
        });
      }

      queryClient.invalidateQueries(["exceptions"]);
      toast.success(`Escalated ${group.document_count} exceptions`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to escalate exceptions");
    }
  };

  const handleDocumentClick = (docId) => {
    router.push(createPageUrl("DocumentViewer") + `?id=${docId}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Badge variant="outline" className={severityStyle.color}>
              <SeverityIcon className="w-3 h-3 mr-1" />
              {group.severity}
            </Badge>
            {group.exception_type}
          </SheetTitle>
          <SheetDescription>
            {group.document_count} impacted documents • $
            {group.total_impact.toLocaleString()} exposure
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <div className="space-y-6">
            {/* Root Cause Analysis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Root Cause Analysis
                </h3>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700">
                  {group.exception_type === "Price Variance" &&
                    "System detected price discrepancies between PO and invoice amounts. This may indicate supplier pricing changes, quantity adjustments, or data entry errors."}
                  {group.exception_type === "Missing POD" &&
                    "Proof of Delivery documents are missing for shipments. This blocks invoice approval and may indicate logistics tracking gaps."}
                  {group.exception_type === "Shortage" &&
                    "Received quantity does not match ordered quantity. This may indicate partial shipments, fulfillment errors, or inventory discrepancies."}
                  {group.exception_type === "Duplicate" &&
                    "System detected potential duplicate invoice submissions based on invoice number, amount, and vendor matching."}
                  {group.exception_type === "Missing Data" &&
                    "Critical data fields are missing or incomplete, preventing automated processing."}
                  {group.exception_type === "Vendor Mismatch" &&
                    "Vendor information does not match purchase order records, indicating potential master data issues."}
                  {![
                    "Price Variance",
                    "Missing POD",
                    "Shortage",
                    "Duplicate",
                    "Missing Data",
                    "Vendor Mismatch",
                  ].includes(group.exception_type) &&
                    "System identified an issue requiring human review before proceeding with automated processing."}
                </p>
              </div>
            </div>

            {/* System Recommendation */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  System Recommendation
                </h3>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-sm text-slate-700">
                  {group.recommended_action ||
                    "Review impacted documents and resolve discrepancies before proceeding with approval workflow."}
                </p>
              </div>
            </div>

            {/* Financial Impact */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Financial Impact
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Total Exposure</p>
                  <p className="text-lg font-bold text-slate-900">
                    ${group.total_impact.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">
                    Avg per Document
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    $
                    {Math.round(
                      group.total_impact / group.document_count
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* SLA Status */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  SLA Status
                </h3>
              </div>
              <div
                className={`rounded-lg p-3 border ${
                  group.sla_status === "Breached"
                    ? "bg-rose-50 border-rose-200"
                    : group.sla_status === "At Risk"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <p className="text-sm font-medium">
                  {group.sla_status === "Breached" &&
                    "SLA deadline has passed — immediate action required"}
                  {group.sla_status === "At Risk" &&
                    "Approaching SLA deadline — prioritize resolution"}
                  {group.sla_status === "On Track" && "Within SLA parameters"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Impacted Documents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Impacted Documents
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="bg-slate-100 text-slate-700"
                >
                  {relatedDocs.length}
                </Badge>
              </div>

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
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 space-y-2">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={handleResolveAll}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Resolve All ({group.document_count})
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEscalate}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Escalate
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
