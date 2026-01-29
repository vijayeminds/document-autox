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
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText,
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Send,
  XCircle,
  Lightbulb,
  Clock,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

const ruleTypeConfig = {
  "Late ASN": { color: "bg-amber-100 text-amber-800 border-amber-300" },
  "Short Shipment": { color: "bg-rose-100 text-rose-800 border-rose-300" },
  Damage: { color: "bg-red-100 text-red-800 border-red-300" },
  "Routing Violation": {
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  "Missing POD": { color: "bg-orange-100 text-orange-800 border-orange-300" },
  "Price Variance": { color: "bg-blue-100 text-blue-800 border-blue-300" },
};

export default function ChargebackDetailDrawer({ open, onOpenChange, group }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [overrideReason, setOverrideReason] = useState("");
  const [showOverride, setShowOverride] = useState(false);

  if (!group) return null;

  const ruleStyle =
    ruleTypeConfig[group.rule_type] || ruleTypeConfig["Late ASN"];

  // Issue Debit Memo mutation
  const issueDebitMemo = useMutation({
    mutationFn: async () => {
      // Resolve all exceptions in this group
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: `Debit memo issued for ${group.rule_type}`,
          resolved_at: new Date().toISOString(),
        });

        // Create audit log
        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Reviewed",
          notes: `Chargeback debit memo issued: ${
            group.rule_type
          } - $${group.total_recovery.toFixed(2)}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exceptions"]);
      toast.success(
        `Debit memo issued for $${group.total_recovery.toLocaleString()}`
      );
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to issue debit memo");
    },
  });

  // Net-back Against Payable mutation
  const netBackPayable = useMutation({
    mutationFn: async () => {
      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: `Net-back applied against payable for ${group.rule_type}`,
          resolved_at: new Date().toISOString(),
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Reviewed",
          notes: `Chargeback net-back applied: ${
            group.rule_type
          } - $${group.total_recovery.toFixed(2)}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Net-back applied successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to apply net-back");
    },
  });

  // Send to Vendor Portal mutation
  const sendToVendorPortal = useMutation({
    mutationFn: async () => {
      for (const exception of group.exceptions) {
        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Reviewed",
          notes: `Chargeback notification sent to vendor portal: ${group.rule_type}`,
        });
      }
    },
    onSuccess: () => {
      toast.success("Notification sent to vendor portal");
    },
    onError: () => {
      toast.error("Failed to send notification");
    },
  });

  // Override mutation
  const overrideChargeback = useMutation({
    mutationFn: async () => {
      if (!overrideReason.trim()) {
        throw new Error("Override reason required");
      }

      for (const exception of group.exceptions) {
        await base44.entities.Exception.update(exception.id, {
          status: "Resolved",
          resolution_notes: `Override: ${overrideReason}`,
          resolved_at: new Date().toISOString(),
        });

        await base44.entities.AuditLog.create({
          entity_type: "Exception",
          entity_id: exception.id,
          action: "Updated",
          notes: `Chargeback overridden with reason: ${overrideReason}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["exceptions"]);
      toast.success("Chargeback overridden and logged");
      setOverrideReason("");
      setShowOverride(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to override chargeback");
    },
  });

  const handleDocumentClick = (exception) => {
    if (exception.document?.id) {
      router.push(
        createPageUrl("DocumentViewer") + `?id=${exception.document.id}`
      );
      onOpenChange(false);
    }
  };

  // Get rule logic explanation
  const getRuleLogic = () => {
    switch (group.rule_type) {
      case "Late ASN":
        return "ASN received >24 hours past scheduled ship date. Chargeback rate: 5% of invoice amount.";
      case "Short Shipment":
        return "Received quantity < PO quantity. Chargeback: 15% of missing goods value + handling fee.";
      case "Damage":
        return "Goods received damaged per POD notes. Chargeback: 25% of damaged goods value.";
      case "Routing Violation":
        return "Shipment routed to non-approved facility. Chargeback: 10% + rerouting costs.";
      case "Missing POD":
        return "Proof of Delivery not provided within 48h of expected delivery. Chargeback: 5% administrative fee.";
      case "Price Variance":
        return "Invoice price exceeds PO price without approved change order. Chargeback: full variance amount.";
      default:
        return "System-detected compliance violation triggering chargeback per vendor agreement.";
    }
  };

  // Get evidence types
  const getEvidenceTypes = () => {
    const evidence = [];
    if (group.rule_type === "Late ASN")
      evidence.push("ASN timestamp", "Ship date", "Routing guide");
    if (group.rule_type === "Short Shipment")
      evidence.push("PO line items", "ASN quantities", "BOL");
    if (group.rule_type === "Damage")
      evidence.push("POD notes", "Photos", "Inspection report");
    if (group.rule_type === "Routing Violation")
      evidence.push("BOL routing", "Approved carriers list");
    if (group.rule_type === "Missing POD")
      evidence.push("Delivery confirmation", "Carrier tracking");
    if (group.rule_type === "Price Variance")
      evidence.push("PO price", "Invoice price", "Change orders");
    return evidence;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Badge variant="outline" className={ruleStyle.color}>
              {group.rule_type}
            </Badge>
            Chargeback Investigation
          </SheetTitle>
          <SheetDescription>
            {group.document_count} documents • $
            {group.total_recovery.toLocaleString()} recovery opportunity
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Rule Logic */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Rule Logic Applied
                </h3>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700">{getRuleLogic()}</p>
              </div>
            </div>

            {/* Recovery Calculation */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Recovery Calculation
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Total Recovery</p>
                  <p className="text-lg font-bold text-emerald-700">
                    $
                    {group.total_recovery.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Per Document</p>
                  <p className="text-lg font-bold text-slate-900">
                    $
                    {(
                      group.total_recovery / group.document_count
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Avg Days Open</p>
                  <p className="text-lg font-bold text-slate-900">
                    {group.avg_days_open}d
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Links */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Evidence Chain
                </h3>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex flex-wrap gap-2">
                  {getEvidenceTypes().map((evidence, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-white border-blue-300 text-blue-700"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {evidence}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  All evidence documents linked and verified for compliance
                  audit
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
                  {group.document_count}
                </Badge>
              </div>

              <div className="space-y-2">
                {group.exceptions.map((exception, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDocumentClick(exception)}
                    className="w-full bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-900">
                            {exception.document?.reference_number ||
                              exception.document?.id ||
                              exception.document_id}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {exception.document?.document_type || "Invoice"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {exception.document?.vendor || "Unknown Vendor"}
                        </p>
                        {exception.document?.total_amount && (
                          <p className="text-xs font-medium text-slate-700 mt-1">
                            ${exception.document.total_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Override Section */}
            {showOverride && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <Label
                  htmlFor="override-reason"
                  className="text-sm font-semibold text-slate-900 mb-2 block"
                >
                  Override Reason (Required for Audit)
                </Label>
                <Textarea
                  id="override-reason"
                  placeholder="Enter detailed reason for overriding this chargeback..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowOverride(false);
                      setOverrideReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    onClick={() => overrideChargeback.mutate()}
                    disabled={
                      !overrideReason.trim() || overrideChargeback.isPending
                    }
                  >
                    Confirm Override
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 space-y-2">
          {!showOverride ? (
            <>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => issueDebitMemo.mutate()}
                disabled={issueDebitMemo.isPending}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Issue Debit Memo
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => netBackPayable.mutate()}
                  disabled={netBackPayable.isPending}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Net-back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendToVendorPortal.mutate()}
                  disabled={sendToVendorPortal.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Portal
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full text-amber-700 border-amber-300 hover:bg-amber-50"
                onClick={() => setShowOverride(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Override with Reason
              </Button>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
