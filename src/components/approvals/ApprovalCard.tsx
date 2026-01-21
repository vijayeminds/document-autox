import React from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";

const decisionConfig = {
  Pending: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  Approved: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  Rejected: {
    color: "bg-rose-100 text-rose-800 border-rose-200",
    icon: XCircle,
  },
  Override: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: AlertCircle,
  },
};

const typeConfig = {
  Standard: "bg-blue-50 text-blue-700",
  Exception: "bg-amber-50 text-amber-700",
  Override: "bg-purple-50 text-purple-700",
  Escalation: "bg-rose-50 text-rose-700",
};

export default function ApprovalCard({
  approval,
  document,
  onApprove,
  onReject,
  onOverride,
}) {
  const router = useRouter();

  const decisionStyle =
    decisionConfig[approval.decision] || decisionConfig["Pending"];
  const DecisionIcon = decisionStyle.icon;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${decisionStyle.color}`}
          >
            <DecisionIcon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={typeConfig[approval.approval_type]}>
                {approval.approval_type}
              </Badge>
              <Badge
                variant="outline"
                className={`${decisionStyle.color} border text-xs`}
              >
                {approval.decision}
              </Badge>
            </div>

            {document && (
              <button
                onClick={() =>
                  router.push(
                    createPageUrl("DocumentViewer") + `?id=${document.id}`
                  )
                }
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-1 mb-1"
              >
                <FileText className="w-3 h-3" />
                {document.document_type} - {document.reference_number}
              </button>
            )}

            {document && (
              <p className="text-xs text-slate-600 mb-2">
                {document.vendor} •{" "}
                {document.document_date &&
                  format(new Date(document.document_date), "MMM d, yyyy")}
              </p>
            )}

            {approval.amount_threshold && (
              <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 mb-2">
                <DollarSign className="w-4 h-4" />
                {approval.amount_threshold.toLocaleString()}
              </div>
            )}

            {approval.rationale && (
              <p className="text-sm text-slate-600 mb-2">
                {approval.rationale}
              </p>
            )}

            {approval.decision_timestamp && (
              <p className="text-xs text-slate-500">
                {approval.decision === "Pending" ? "Requested" : "Decided"}:{" "}
                {format(
                  new Date(approval.decision_timestamp),
                  "MMM d, yyyy h:mm a"
                )}
              </p>
            )}
          </div>
        </div>

        {approval.approver && (
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Approver</p>
            <p className="text-xs font-medium text-slate-900">
              {approval.approver}
            </p>
          </div>
        )}
      </div>

      {approval.decision === "Pending" && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button
            size="sm"
            onClick={() => onApprove(approval)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approve
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(approval)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Reject
          </Button>

          {approval.approval_type === "Exception" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOverride(approval)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 ml-auto"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Override
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
