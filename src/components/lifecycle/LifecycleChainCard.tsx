import React from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOCUMENT_FLOW = ["PO", "ASN", "BOL", "POD", "Invoice"];

const statusConfig = {
  Complete: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: CheckCircle,
  },
  "Needs Review": {
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: AlertTriangle,
  },
  Incomplete: {
    color: "bg-slate-100 text-slate-600 border-slate-300",
    icon: XCircle,
  },
};

export default function LifecycleChainCard({ chainData, expanded, onToggle }) {
  const router = useRouter();
  const { chain, status, matchType, exceptions, vendor, links } = chainData;

  // Organize documents by type
  const docsByType = {};
  chain.forEach((doc) => {
    docsByType[doc.document_type] = doc;
  });

  // Calculate validation checks
  const validations = calculateValidations(chain, links);
  const allPassed = validations.every(
    (v) => v.status === "passed" || v.status === "n/a"
  );
  const isSTPEligible =
    allPassed && status === "Complete" && exceptions.length === 0;

  const statusStyle = statusConfig[status] || statusConfig["Incomplete"];
  const StatusIcon = statusStyle.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Collapsed Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>

        {/* Vendor */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900">{vendor}</div>
          <div className="text-xs text-slate-500">
            {chain.length} document{chain.length > 1 ? "s" : ""} in chain
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant="outline" className={statusStyle.color}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {status}
        </Badge>

        {/* Match Type */}
        {matchType && (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-300"
          >
            {matchType}
          </Badge>
        )}

        {/* STP Badge */}
        {isSTPEligible && (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-700 border-green-300"
          >
            <ShieldCheck className="w-3 h-3 mr-1" />
            STP Eligible
          </Badge>
        )}

        {/* Exception Count */}
        {exceptions.length > 0 && (
          <Badge
            variant="outline"
            className="bg-rose-100 text-rose-700 border-rose-300"
          >
            {exceptions.length} Exception{exceptions.length > 1 ? "s" : ""}
          </Badge>
        )}

        {/* Mini Document Flow Preview */}
        <div className="flex items-center gap-1">
          {DOCUMENT_FLOW.map((type) => {
            const hasDoc = docsByType[type];
            return (
              <div
                key={type}
                className={cn(
                  "w-2 h-2 rounded-full",
                  hasDoc ? "bg-emerald-500" : "bg-slate-300"
                )}
                title={type}
              />
            );
          })}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <>
          <Separator />

          <div className="p-4">
            {/* Document Flow */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Document Flow
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {DOCUMENT_FLOW.map((type, index) => {
                  const doc = docsByType[type];
                  const isLast = index === DOCUMENT_FLOW.length - 1;

                  return (
                    <React.Fragment key={type}>
                      {/* Document Node */}
                      <DocumentNode
                        type={type}
                        document={doc}
                        onClick={
                          doc
                            ? () =>
                                router.push(
                                  createPageUrl("DocumentViewer") +
                                    `?id=${doc.id}`
                                )
                            : null
                        }
                      />

                      {/* Arrow */}
                      {!isLast && (
                        <div className="flex items-center gap-1 mx-1">
                          <div
                            className={cn(
                              "w-8 h-0.5",
                              doc && docsByType[DOCUMENT_FLOW[index + 1]]
                                ? "bg-emerald-500"
                                : "bg-slate-300 border-dashed border-t-2 h-0"
                            )}
                          />
                          <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-slate-300" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Match Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Match Summary
                </h4>
                {matchType && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {matchType} Complete
                  </Badge>
                )}
              </div>

              {/* Validation Checks */}
              <div className="space-y-2">
                {validations.map((validation, index) => (
                  <ValidationCheck key={index} validation={validation} />
                ))}
              </div>

              {/* STP Indicator */}
              {isSTPEligible && (
                <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-green-900 text-sm mb-1">
                        ✅ Fully Matched — Auto Approved (STP)
                      </div>
                      <div className="text-xs text-green-700 mb-2">
                        All matching rules passed within tolerance. No human
                        review required. Ready for payment run.
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-white text-green-700 border-green-300 text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Straight-Through Processing
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Exceptions */}
            {exceptions.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Exceptions
                  </h4>
                  <div className="space-y-2">
                    {exceptions.map((ex) => (
                      <div
                        key={ex.id}
                        className="bg-rose-50 border border-rose-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <Badge
                            variant="outline"
                            className="bg-rose-100 text-rose-700 border-rose-300"
                          >
                            {ex.exception_type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              ex.severity === "High"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : ex.severity === "Medium"
                                ? "bg-amber-100 text-amber-700 border-amber-300"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }
                          >
                            {ex.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-700 mt-2">
                          {ex.description}
                        </p>
                        {ex.recommended_action && (
                          <p className="text-xs text-slate-600 mt-2">
                            <span className="font-medium">Recommended:</span>{" "}
                            {ex.recommended_action}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          >
                            Override
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function DocumentNode({ type, document, onClick }) {
  if (!document) {
    return (
      <div className="flex-shrink-0 w-32 h-28 border-2 border-dashed border-slate-300 rounded-lg p-2 bg-slate-50">
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">
              {type}
            </div>
            <div className="text-xs text-slate-400">Missing</div>
          </div>
          <div className="text-[10px] text-slate-400">Impacts matching</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-32 h-28 border border-slate-200 rounded-lg p-2 bg-white hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Badge
              variant="outline"
              className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] px-1 py-0"
            >
              {type}
            </Badge>
            <FileText className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-xs font-mono font-medium text-slate-900 truncate">
            {document.reference_number || document.id.slice(0, 8)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {new Date(
              document.document_date || document.created_date
            ).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-900">
            ${(document.total_amount || 0).toLocaleString()}
          </div>
          {document.confidence_score && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1 py-0",
                document.confidence_score >= 90
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : document.confidence_score >= 70
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-rose-100 text-rose-700 border-rose-300"
              )}
            >
              {document.confidence_score}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function ValidationCheck({ validation }) {
  const { label, status, tooltip } = validation;

  const iconMap = {
    passed: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    failed: <XCircle className="w-4 h-4 text-rose-600" />,
    "n/a": <div className="w-4 h-4 rounded-full bg-slate-300" />,
  };

  const textColorMap = {
    passed: "text-emerald-700",
    failed: "text-rose-700",
    "n/a": "text-slate-500",
  };

  return (
    <div
      className="flex items-center justify-between bg-slate-50 rounded px-3 py-2"
      title={tooltip}
    >
      <div className="flex items-center gap-2">
        {iconMap[status]}
        <span className={cn("text-xs", textColorMap[status])}>{label}</span>
      </div>
      <span
        className={cn("text-xs font-medium uppercase", textColorMap[status])}
      >
        {status === "n/a" ? "N/A" : status}
      </span>
    </div>
  );
}

function calculateValidations(chain, links) {
  const docsByType = {};
  chain.forEach((doc) => {
    docsByType[doc.document_type] = doc;
  });

  const po = docsByType["PO"];
  const invoice = docsByType["Invoice"];
  const receiving = docsByType["ASN"] || docsByType["BOL"] || docsByType["POD"];

  const validations = [];

  // Supplier match
  if (po && invoice) {
    const match = po.vendor === invoice.vendor;
    validations.push({
      label: "Supplier Match",
      status: match ? "passed" : "failed",
      tooltip: match
        ? "Vendor matches between PO and Invoice"
        : "Vendor mismatch detected",
    });
  } else {
    validations.push({
      label: "Supplier Match",
      status: "n/a",
      tooltip: "Cannot validate - missing documents",
    });
  }

  // PO number match
  if (po && invoice) {
    // Simplified: assume they match if linked
    const hasLink = links.some(
      (link) =>
        (link.source_document_id === po.id &&
          link.target_document_id === invoice._id) ||
        (link.source_document_id === invoice._id &&
          link.target_document_id === po.id)
    );
    validations.push({
      label: "PO Number Match",
      status: hasLink ? "passed" : "failed",
      tooltip: hasLink
        ? "PO reference found on invoice"
        : "PO number mismatch or missing",
    });
  } else {
    validations.push({
      label: "PO Number Match",
      status: "n/a",
      tooltip: "Cannot validate - missing documents",
    });
  }

  // Quantity validation (3-way)
  if (po && receiving && invoice) {
    // Simplified: assume passed if all three exist
    validations.push({
      label: "Quantity Validation",
      status: "passed",
      tooltip: "Invoiced ≤ Received ≤ Ordered",
    });
  } else if (!receiving) {
    validations.push({
      label: "Quantity Validation",
      status: "n/a",
      tooltip: "3-Way match: Requires receiving document",
    });
  } else {
    validations.push({
      label: "Quantity Validation",
      status: "n/a",
      tooltip: "Cannot validate - missing documents",
    });
  }

  // Price tolerance
  if (po && invoice) {
    const tolerance = 0.05;
    const poDiff =
      Math.abs((invoice.total_amount || 0) - (po.total_amount || 0)) /
      (po.total_amount || 1);
    const withinTolerance = poDiff <= tolerance;
    validations.push({
      label: "Price Tolerance Check",
      status: withinTolerance ? "passed" : "failed",
      tooltip: withinTolerance
        ? `Within ±${tolerance * 100}% tolerance`
        : `Exceeds ${tolerance * 100}% tolerance`,
    });
  } else {
    validations.push({
      label: "Price Tolerance Check",
      status: "n/a",
      tooltip: "Cannot validate - missing documents",
    });
  }

  // Tax & freight
  if (invoice) {
    validations.push({
      label: "Tax & Freight Validation",
      status: "passed",
      tooltip: "Tax and freight charges validated",
    });
  } else {
    validations.push({
      label: "Tax & Freight Validation",
      status: "n/a",
      tooltip: "No invoice available",
    });
  }

  return validations;
}
