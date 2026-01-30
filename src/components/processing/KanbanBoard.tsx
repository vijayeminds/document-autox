import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { axiosInstance } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Flag,
  Clock,
  DollarSign,
  X,
  FileQuestion,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const COLUMNS = [
  {
    id: "Received",
    title: "Received",
    color: "bg-slate-50/40",
    headerColor: "bg-slate-100",
    textColor: "text-slate-900",
  },
  {
    id: "Processing",
    title: "Processing",
    color: "bg-blue-50/40",
    headerColor: "bg-blue-100",
    textColor: "text-blue-900",
  },
  {
    id: "Needs Review",
    title: "Review Needed",
    color: "bg-amber-50/40",
    headerColor: "bg-amber-100",
    textColor: "text-amber-900",
  },
  {
    id: "Matched",
    title: "Matched to Orders",
    color: "bg-emerald-50/40",
    headerColor: "bg-emerald-100",
    textColor: "text-emerald-900",
  },
  {
    id: "Exception",
    title: "Exceptions",
    color: "bg-rose-50/40",
    headerColor: "bg-rose-100",
    textColor: "text-rose-900",
  },
  {
    id: "Approved",
    title: "Approved / Posted",
    color: "bg-green-50/40",
    headerColor: "bg-green-100",
    textColor: "text-green-900",
  },
];

const getStatusBadge = (status) => {
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

const getSLAStatus = (hours) => {
  if (hours === null)
    return {
      color: "bg-slate-100 text-slate-600",
      label: "Complete",
      pulse: false,
    };
  if (hours < 0)
    return {
      color: "bg-rose-100 text-rose-700",
      label: "SLA Missed",
      pulse: true,
    };
  if (hours <= 3)
    return {
      color: "bg-amber-100 text-amber-700",
      label: `SLA: ${hours}h`,
      pulse: false,
    };
  return {
    color: "bg-emerald-100 text-emerald-700",
    label: `SLA: ${hours}h`,
    pulse: false,
  };
};

const getExceptionColor = (issue) => {
  const colors = {
    "Missing PO": "bg-orange-100 text-orange-700 border-orange-200",
    "Price variance": "bg-rose-100 text-rose-700 border-rose-200",
    "Quantity mismatch": "bg-amber-100 text-amber-700 border-amber-200",
    Duplicate: "bg-purple-100 text-purple-700 border-purple-200",
    "Missing POD": "bg-red-100 text-red-700 border-red-200",
  };
  return colors[issue] || "bg-slate-100 text-slate-700 border-slate-200";
};

export default function KanbanBoard({ invoices }) {
  const router = useRouter();
  const [localInvoices, setLocalInvoices] = useState(invoices);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedHighlightId, setSelectedHighlightId] = useState(null);
  const [poMatchData, setPoMatchData] = useState(null);
  const [allPoMatches, setAllPoMatches] = useState([]);

  // Fetch all PO matches on component mount
  useEffect(() => {
    const fetchAllPoMatches = async () => {
      try {
        const { data } = await axiosInstance.get("/api/v1/invoice/po-match");
        console.log("✅ Fetched PO Matches:", data);
        console.log("📊 Total PO matches:", data?.data?.length || 0);
        console.log(
          "📋 PO Match po_ids:",
          data?.data?.map((m) => m.po_id) || [],
        );
        setAllPoMatches(data?.data || []);
      } catch (error) {
        console.log("❌ Error fetching PO matches:", error);
        setAllPoMatches([]);
      }
    };
    fetchAllPoMatches();
  }, []);

  // Update local state when prop changes
  React.useEffect(() => {
    setLocalInvoices(invoices);
  }, [invoices]);

  // Fetch specific PO match data when an invoice is selected
  useEffect(() => {
    if (selectedInvoice?._id) {
      const fetchPoMatch = async () => {
        try {
          // Try to fetch specific PO match data for this invoice
          const { data } = await axiosInstance.get(
            `/api/v1/invoice/po-match/${selectedInvoice._id}`,
          );
          console.log("PO Match Data for invoice:", data);
          setPoMatchData(data?.data || data);
        } catch (error) {
          console.log("No PO match data found or error:", error);
          // Fallback: try to find in allPoMatches
          const matchData = allPoMatches.find(
            (match) =>
              match.po_id === selectedInvoice.po_id ||
              match._id === selectedInvoice._id,
          );
          setPoMatchData(matchData || null);
        }
      };
      fetchPoMatch();
    } else {
      setPoMatchData(null);
    }
  }, [selectedInvoice, allPoMatches]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const updated = localInvoices.map((inv) => {
      if (inv.id === draggableId) {
        return { ...inv, status: destination.droppableId };
      }
      return inv;
    });

    setLocalInvoices(updated);
    toast.success(`Moved to ${destination.droppableId}`);
  };

  const handleCardClick = (invoice) => {
    // Navigate to document viewer page with view type based on bucket
    const docId = invoice._id || "doc_sample_" + invoice.id;
    let viewType = "default";

    console.log("🔍 Invoice bucket_name:", invoice.bucket_name);
    console.log("🔍 Invoice status:", invoice.status);
    console.log("🔍 Invoice po_id:", invoice.po_id);

    // Check if this invoice has a PO match (meaning it's in Matched column)
    const hasPoMatch = allPoMatches.some(
      (match) => match.po_id === invoice.po_id || match._id === invoice._id,
    );
    console.log("🔍 Has PO match:", hasPoMatch);

    if (hasPoMatch) {
      viewType = "matched"; // PDF + Extracted Data + PO Data (3 columns)
    } else if (invoice.bucket_name === "Received") {
      viewType = "received"; // Only PDF
    } else if (
      invoice.bucket_name === "Review Needed" ||
      invoice.bucket_name === "Needs Review"
    ) {
      viewType = "review"; // PDF + Extracted Data (2 columns)
    }

    console.log("🎯 Navigating with viewType:", viewType);

    router.push(
      createPageUrl("Document-Viewer") + `?id=${docId}&view=${viewType}`,
    );
  };

  // Calculate column summaries
  const getColumnSummary = (columnId) => {
    const columnInvoices = localInvoices.filter(
      (inv) => inv.status === columnId,
    );
    const totalValue = columnInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const slaBreaches = columnInvoices.filter(
      (inv) => inv.sla_hours !== null && inv.sla_hours < 0,
    ).length;
    const atRisk = columnInvoices.filter(
      (inv) =>
        inv.sla_hours !== null && inv.sla_hours > 0 && inv.sla_hours <= 3,
    ).length;

    return { totalValue, slaBreaches, atRisk, count: columnInvoices.length };
  };

  return (
    <TooltipProvider>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 px-4 py-4 h-full min-w-max">
            {COLUMNS.map((column) => {
              let columnInvoices;

              // First, identify all invoices that have PO matches
              const invoicesWithPoMatches = localInvoices.filter((inv) => {
                return allPoMatches.some(
                  (match) => match.po_id === inv.po_id || match._id === inv._id,
                );
              });

              const matchedInvoiceIds = new Set(
                invoicesWithPoMatches.map((inv) => inv._id),
              );

              if (column.id === "Matched") {
                console.log("🔍 Filtering for Matched column:");
                console.log("  Total invoices:", localInvoices.length);
                console.log("  Total PO matches:", allPoMatches.length);
                console.log(
                  "  Invoice po_ids:",
                  localInvoices.map((inv) => inv.po_id),
                );
                console.log(
                  "  PO match po_ids:",
                  allPoMatches.map((m) => m.po_id),
                );

                // Only include invoices that have a PO match entry
                columnInvoices = invoicesWithPoMatches;
                console.log(
                  `✅ Matched column has ${columnInvoices.length} invoices`,
                );
              } else {
                // For other columns, exclude invoices that have PO matches
                columnInvoices = localInvoices.filter(
                  (inv) =>
                    inv.bucket_name === column.id &&
                    !matchedInvoiceIds.has(inv._id),
                );
              }

              const summary = getColumnSummary(column.id);

              return (
                <div
                  key={column.id}
                  className="flex-shrink-0 flex flex-col h-full transition-all duration-250 w-[300px]"
                >
                  {/* Column Header - Enhanced */}
                  <div
                    className={`${column.headerColor} rounded-t-xl px-4 py-3 border-b border-slate-200 flex-shrink-0`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`font-semibold ${column.textColor} text-sm`}
                      >
                        {column.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-white border-slate-300 text-slate-700 font-semibold text-xs px-2.5"
                      >
                        {summary.count}
                      </Badge>
                    </div>

                    {/* Column Summary */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {summary.totalValue > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="bg-white border-slate-300 text-slate-700 text-xs"
                            >
                              ${(summary.totalValue / 1000).toFixed(0)}K
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Total value in this stage</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {summary.slaBreaches > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="bg-rose-100 text-rose-700 border-rose-200 text-xs"
                            >
                              {summary.slaBreaches} breached
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              SLA breaches requiring immediate attention
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {summary.atRisk > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-700 border-amber-200 text-xs"
                            >
                              {summary.atRisk} at risk
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Invoices approaching SLA deadline
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Column Content - Enhanced */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`${column.color} rounded-b-xl p-3 flex-1 overflow-y-auto space-y-3 transition-all ${
                          snapshot.isDraggingOver
                            ? "ring-2 ring-offset-1 " +
                              column.headerColor.replace("bg-", "ring-")
                            : ""
                        }`}
                        style={{
                          minHeight: "200px",
                        }}
                      >
                        {columnInvoices.map((invoice, index) => {
                          const badgeConfig = getStatusBadge(
                            invoice.bucket_name,
                          );
                          const StatusIcon = badgeConfig.icon;

                          const slaStatus = getSLAStatus(invoice.sla_hours);

                          return (
                            <Draggable
                              key={invoice._id}
                              draggableId={invoice._id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onMouseEnter={() =>
                                    setHoveredCard(invoice._id)
                                  }
                                  onMouseLeave={() => setHoveredCard(null)}
                                  className={`bg-white rounded-xl border cursor-pointer transition-all relative p-4 ${
                                    snapshot.isDragging
                                      ? "shadow-2xl rotate-2 scale-105 border-slate-300"
                                      : hoveredCard === invoice._id
                                        ? "shadow-xl -translate-y-1 border-slate-300"
                                        : "shadow-md hover:shadow-lg border-slate-200"
                                  }`}
                                  onClick={() => handleCardClick(invoice)}
                                >
                                  {/* Invoice ID */}
                                  <div className="mb-3">
                                    <span className="text-sm font-mono font-bold text-slate-900">
                                      {invoice.po_id}
                                    </span>
                                  </div>

                                  {/* Vendor */}
                                  <div className="mb-3">
                                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                                      {invoice.extracted_json?.supplier?.name}
                                    </p>
                                    {invoice.po_id && (
                                      <p className="text-xs text-slate-500 mt-1 font-medium">
                                        PO: {invoice.po_id}
                                      </p>
                                    )}
                                  </div>

                                  {/* Amount */}
                                  <div className="mb-4">
                                    <p className="text-2xl font-extrabold text-slate-900">
                                      $
                                      {invoice.extracted_json?.summary?.grand_total?.toLocaleString()}
                                    </p>
                                  </div>

                                  {/* Status Badge - Full Width Button at Bottom */}
                                  <div className="mt-auto">
                                    <div
                                      className={`${badgeConfig.color} border-0 rounded-lg py-2.5 px-3 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm`}
                                    >
                                      {StatusIcon && (
                                        <StatusIcon className="w-4 h-4" />
                                      )}
                                      {invoice.status === "Needs Review"
                                        ? "Needs Review"
                                        : invoice.bucket_name}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {columnInvoices.length === 0 && (
                          <div className="text-center py-16 text-slate-400">
                            <div className="bg-white/50 rounded-xl p-6 backdrop-blur-sm">
                              <p className="text-sm font-medium">No invoices</p>
                              <p className="text-xs mt-1">Drop items here</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Document Viewer Modal - Focused View Only */}
    </TooltipProvider>
  );
}
