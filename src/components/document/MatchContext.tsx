import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Link2,
  Package,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MatchContext({ document, links, relatedDocs }) {
  // Validate totals
  const subtotal = 26000;
  const tax = 2600;
  const grandTotal = 28600;
  const calculatedTotal = subtotal + tax;
  const totalsMatch = calculatedTotal === grandTotal;

  const getMatchStatus = () => {
    if (document.confidence_score >= 95 && totalsMatch) {
      return {
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        status: "Ready to Approve",
        action: "All validations passed",
      };
    }
    if (document.confidence_score >= 85) {
      return {
        icon: CheckCircle2,
        color: "text-blue-600",
        bg: "bg-blue-50",
        status: "Review",
        action: "Verify key fields",
      };
    }
    return {
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      status: "Needs Attention",
      action: "Resolve discrepancies",
    };
  };

  const matchStatus = getMatchStatus();
  const StatusIcon = matchStatus.icon;

  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Match Context</h2>
        <p className="text-xs text-slate-500 mt-1">
          Related documents and validation
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Recommended Action */}
        <div
          className={`rounded-lg border p-4 ${
            matchStatus.bg
          } border-${matchStatus.color.replace("text-", "")}`}
        >
          <div className="flex items-start gap-3">
            <StatusIcon className={`w-5 h-5 ${matchStatus.color} mt-0.5`} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                {matchStatus.status}
              </h3>
              <p className="text-xs text-slate-600">{matchStatus.action}</p>
            </div>
          </div>
        </div>

        {/* Linked Documents */}
        {links && links.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Link2 className="w-3 h-3" />
              Linked Documents
            </h3>

            <div className="space-y-2">
              {links.slice(0, 3).map((link, index) => {
                const relatedDoc = relatedDocs?.find(
                  (d) =>
                    d.id === link.source_document_id ||
                    d.id === link.target_document_id
                );

                if (!relatedDoc) return null;

                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-900">
                          {relatedDoc.document_type}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          link.status === "Matched"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {link.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-500">Ref:</span>
                        <span className="ml-1 font-medium">
                          {relatedDoc.reference_number}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Confidence:</span>
                        <span className="ml-1 font-medium">
                          {link.match_confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Totals Validation */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" />
            Totals Validation
          </h3>

          <div
            className={`border rounded-lg p-3 space-y-2 ${
              totalsMatch
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-amber-200 bg-amber-50/30"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium text-slate-900">
                ${subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Tax (10%)</span>
              <span className="font-medium text-slate-900">
                +${tax.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-600">Calculated Total</span>
              <span className="font-semibold text-slate-900">
                ${calculatedTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2">
              <span className="text-slate-600">Grand Total</span>
              <span className="font-semibold text-slate-900">
                ${grandTotal.toLocaleString()}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 pt-2 border-t ${
                totalsMatch ? "border-emerald-200" : "border-amber-200"
              }`}
            >
              {totalsMatch ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700 font-medium">
                    Totals Validated ✓
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-700 font-medium">
                    Totals Need Review
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Summary */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="w-3 h-3" />
            Line Items Summary
          </h3>

          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Items</span>
              <span className="font-medium text-slate-900">4 items</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Foundation Work</span>
              <span className="font-medium text-slate-900">$1,000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Steel Structure</span>
              <span className="font-medium text-slate-900">$10,000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Concrete Material</span>
              <span className="font-medium text-slate-900">$10,000</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-500">Steel Material</span>
              <span className="font-medium text-slate-900">$5,000</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-medium">
                All items extracted
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!totalsMatch}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve Document
          </Button>
          <Button variant="outline" className="w-full">
            Mark Needs Review
          </Button>
          <Button
            variant="outline"
            className="w-full text-rose-600 hover:text-rose-700"
          >
            Create Exception
          </Button>
        </div>
      </div>
    </div>
  );
}
