import React from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  Flag,
  DollarSign,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getStatusConfig = (status) => {
  const configs = {
    Matched: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: CheckCircle2,
    },
    "Needs Review": {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: AlertTriangle,
    },
    Exception: {
      color: "bg-rose-100 text-rose-800 border-rose-200",
      icon: XCircle,
    },
    Processing: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: null,
    },
    Received: {
      color: "bg-slate-100 text-slate-800 border-slate-200",
      icon: null,
    },
    Approved: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle2,
    },
  };
  return configs[status] || configs["Received"];
};

const getSLABadge = (hours) => {
  if (hours === null)
    return { color: "bg-slate-100 text-slate-600", label: "Complete" };
  if (hours < 0) return { color: "bg-rose-100 text-rose-700", label: "Missed" };
  if (hours <= 3)
    return { color: "bg-amber-100 text-amber-700", label: `${hours}h` };
  return { color: "bg-emerald-100 text-emerald-700", label: `${hours}h` };
};

export default function WorklistTable({ invoices }) {
  const router = useRouter();
  const [hoveredRow, setHoveredRow] = React.useState(null);

  const handleReview = (invoice) => {
    router.push(createPageUrl("DocumentViewer") + `?id=${invoice.id}`);
  };

  return (
    <TooltipProvider>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-700">
                Invoice ID
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Vendor
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                PO Number
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Status
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                SLA
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Current Step
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Impact
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-slate-500"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const statusConfig = getStatusConfig(invoice.bucket_name);
                const StatusIcon = statusConfig.icon;
                const slaBadge = getSLABadge(invoice.sla_hours);

                return (
                  <TableRow
                    key={invoice.id}
                    className="hover:bg-slate-50 transition-all cursor-pointer group"
                    onClick={() => handleReview(invoice)}
                    onMouseEnter={() => setHoveredRow(invoice.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <TableCell className="font-mono font-medium text-slate-900">
                      {invoice.po_id}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {invoice.extracted_json?.supplier?.name || "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      ${invoice.extracted_json?.summary?.grand_total?.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 text-sm">
                      {invoice.po_id || (
                        <span className="text-amber-600 font-medium">
                          Missing
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusConfig.color} border`}
                      >
                        {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                        {invoice.bucket_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${slaBadge.color} border text-xs`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {slaBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm max-w-xs">
                      {invoice.step}
                      {invoice.issue && invoice.status !== "Exception" && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-amber-50 text-amber-700 border-amber-200 text-xs"
                        >
                          {invoice.issue}
                        </Badge>
                      )}
                      {invoice.status === "Exception" && invoice.issue && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-rose-50 text-rose-700 border-rose-200 text-xs"
                        >
                          {invoice.issue}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {invoice.exception_impact ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-700 border-slate-300 text-xs"
                            >
                              <DollarSign className="w-3 h-3 mr-0.5" />$
                              {(invoice.exception_impact / 1000).toFixed(1)}K
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Potential recovery: $
                              {invoice.exception_impact.toLocaleString()}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hoveredRow === invoice.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Flag className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReview(invoice);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
