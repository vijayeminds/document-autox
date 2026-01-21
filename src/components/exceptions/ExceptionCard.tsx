import React from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

const severityConfig = {
  Low: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
  },
  Medium: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertCircle,
  },
  High: {
    color: "bg-rose-100 text-rose-800 border-rose-200",
    icon: AlertCircle,
  },
};

const statusConfig = {
  Open: { color: "bg-slate-100 text-slate-800", icon: Clock },
  "In Review": { color: "bg-blue-100 text-blue-800", icon: Clock },
  Resolved: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  Escalated: { color: "bg-rose-100 text-rose-800", icon: TrendingUp },
};

export default function ExceptionCard({
  exception,
  document,
  onResolve,
  onEscalate,
}) {
  const router = useRouter();

  const severityStyle =
    severityConfig[exception.severity] || severityConfig["Medium"];
  const statusStyle = statusConfig[exception.status] || statusConfig["Open"];
  const SeverityIcon = severityStyle.icon;
  const StatusIcon = statusStyle.icon;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${severityStyle.color}`}
          >
            <SeverityIcon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">
                {exception.exception_type}
              </h3>
              <Badge
                variant="outline"
                className={`${severityStyle.color} border text-xs`}
              >
                {exception.severity}
              </Badge>
            </div>

            {document && (
              <button
                onClick={() =>
                  router.push(
                    createPageUrl("DocumentViewer") + `?id=${document.id}`
                  )
                }
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"
              >
                <FileText className="w-3 h-3" />
                {document.document_type} - {document.reference_number}
              </button>
            )}

            <p className="text-sm text-slate-600 mb-2">
              {exception.description}
            </p>

            {exception.recommended_action && (
              <div className="bg-blue-50 border border-blue-100 rounded px-3 py-2 text-xs text-blue-900">
                <span className="font-medium">Recommended: </span>
                {exception.recommended_action}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge className={statusStyle.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {exception.status}
          </Badge>

          {exception.created_date && (
            <span className="text-xs text-slate-500">
              {format(new Date(exception.created_date), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {exception.status !== "Resolved" && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(exception)}
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Resolve
          </Button>

          {exception.status !== "Escalated" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEscalate(exception)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Escalate
            </Button>
          )}

          {exception.assigned_to && (
            <span className="text-xs text-slate-500 ml-auto">
              Assigned to: {exception.assigned_to}
            </span>
          )}
        </div>
      )}

      {exception.status === "Resolved" && exception.resolution_notes && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            <span className="font-medium">Resolution: </span>
            {exception.resolution_notes}
          </p>
        </div>
      )}
    </div>
  );
}
