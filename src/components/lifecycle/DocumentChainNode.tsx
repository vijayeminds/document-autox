import React from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

const typeColors = {
  PO: "bg-blue-50 border-blue-200 text-blue-700",
  ASN: "bg-purple-50 border-purple-200 text-purple-700",
  BOL: "bg-orange-50 border-orange-200 text-orange-700",
  POD: "bg-teal-50 border-teal-200 text-teal-700",
  Invoice: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

export default function DocumentChainNode({ document, linkStatus, onClick }) {
  const router = useRouter();

  const handleClick = () => {
    if (document) {
      router.push(createPageUrl("DocumentViewer") + `?id=${document.id}`);
    }
  };

  if (!document) {
    // Missing document node
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-48 h-32 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center">
          <XCircle className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Missing Document</p>
        </div>
        <div className="text-xs text-slate-400">Not found</div>
      </div>
    );
  }

  const typeColor = typeColors[document.document_type] || typeColors["PO"];

  const getLinkStatusIndicator = () => {
    if (!linkStatus) return null;

    if (linkStatus === "Matched") {
      return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    }
    if (linkStatus === "Mismatch") {
      return <XCircle className="w-3 h-3 text-rose-600" />;
    }
    if (linkStatus === "Partial") {
      return <AlertTriangle className="w-3 h-3 text-amber-600" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className={`w-48 border-2 rounded-lg p-4 transition-all hover:shadow-md hover:scale-105 cursor-pointer ${typeColor}`}
      >
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="text-xs font-semibold">
            {document.document_type}
          </Badge>
          {getLinkStatusIndicator()}
        </div>

        <p className="text-sm font-semibold text-slate-900 mb-1 truncate">
          {document.vendor}
        </p>

        <p className="text-xs text-slate-600 font-mono mb-2 truncate">
          {document.reference_number || "No ref"}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {document.document_date
              ? format(new Date(document.document_date), "MMM d")
              : "—"}
          </span>
          {document.total_amount && (
            <span className="font-semibold text-slate-700">
              ${document.total_amount.toLocaleString()}
            </span>
          )}
        </div>

        {document.confidence_score && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Confidence</span>
              <span
                className={`font-medium ${
                  document.confidence_score >= 85
                    ? "text-emerald-600"
                    : document.confidence_score >= 70
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {document.confidence_score}%
              </span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
