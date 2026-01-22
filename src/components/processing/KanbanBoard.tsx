import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Flag,
  Clock,
  DollarSign,
  X,
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
  { id: "Received", title: "Received", color: "bg-slate-100" },
  { id: "Processing", title: "Processing", color: "bg-blue-100" },
  { id: "Needs Review", title: "Review Needed", color: "bg-amber-100" },
  { id: "Matched", title: "Matched to Orders", color: "bg-emerald-100" },
  { id: "Exception", title: "Exceptions", color: "bg-rose-100" },
  { id: "Approved", title: "Approved / Posted", color: "bg-green-100" },
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

export default function KanbanBoard({ invoices, focusedView = false }) {
  const router = useRouter();
  const [localInvoices, setLocalInvoices] = useState(invoices);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Update local state when prop changes
  React.useEffect(() => {
    setLocalInvoices(invoices);
  }, [invoices]);

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
    if (focusedView) {
      // In focused view, open modal - use document_id from sample data
      const docId = invoice._id || "doc_sample_" + invoice.id;
      setSelectedInvoiceId(docId);
      setModalOpen(true);
    } else {
      // In normal view, navigate to page
      const docId = invoice._id || "doc_sample_" + invoice.id;
      router.push(createPageUrl("Document-Viewer") + `?id=${docId}`);
    }
  };

  // Calculate column summaries
  const getColumnSummary = (columnId) => {
    const columnInvoices = localInvoices.filter(
      (inv) => inv.status === columnId
    );
    const totalValue = columnInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const slaBreaches = columnInvoices.filter(
      (inv) => inv.sla_hours !== null && inv.sla_hours < 0
    ).length;
    const atRisk = columnInvoices.filter(
      (inv) => inv.sla_hours !== null && inv.sla_hours > 0 && inv.sla_hours <= 3
    ).length;

    return { totalValue, slaBreaches, atRisk, count: columnInvoices.length };
  };

  return (
    <TooltipProvider>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 px-4 py-4 h-full min-w-max">
            {COLUMNS.map((column) => {
            const columnInvoices = localInvoices.filter(
              (inv) => inv.bucket_name === column.id
            );
            const summary = getColumnSummary(column.id);

            return (
              <div
                key={column.id}
                className={`flex-shrink-0 flex flex-col h-full transition-all duration-250 ${
                  focusedView ? "w-[220px]" : "w-[280px]"
                }`}
              >
                {/* Column Header */}
                <div
                  className={`${column.color} rounded-t-lg px-3 py-2.5 border-b border-slate-200 flex-shrink-0`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {column.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-white border-slate-300 text-slate-700 font-semibold text-xs"
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
                            className="bg-white/60 border-slate-300 text-slate-700 text-xs"
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

                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-slate-50 rounded-b-lg p-2.5 flex-1 overflow-y-auto space-y-2.5 transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-slate-100 ring-2 ring-slate-300"
                          : ""
                      }`}
                    >
                      {columnInvoices.map((invoice, index) => {
                        const badgeConfig = getStatusBadge(invoice.bucket_name);
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
                                onMouseEnter={() => setHoveredCard(invoice.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className={`bg-white rounded-lg border border-slate-200 cursor-pointer transition-all relative ${
                                  focusedView ? "p-2" : "p-3"
                                } ${
                                  snapshot.isDragging
                                    ? "shadow-2xl rotate-2 scale-105"
                                    : hoveredCard === invoice.id
                                    ? "shadow-lg -translate-y-0.5"
                                    : "shadow-sm hover:shadow-md"
                                }`}
                                onClick={() => handleCardClick(invoice)}
                              >
                                {focusedView ? (
                                  // FOCUSED VIEW - Compressed Card
                                  <>
                                    {/* Invoice ID & Status */}
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="text-xs font-mono font-semibold text-slate-900 truncate">
                                        {invoice.po_id}
                                      </span>
                                    </div>

                                    {/* Vendor - Truncated */}
                                    <div className="mb-1.5">
                                      <p className="text-xs font-medium text-slate-700 truncate">
                                        {invoice.extracted_json?.supplier?.name}
                                      </p>
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-1.5">
                                      <p className="text-sm font-bold text-slate-900">
                                        ${invoice.extracted_json?.summary?.grand_total?.toLocaleString()}
                                      </p>
                                    </div>

                                    {/* Status Badge */}
                                    <Badge
                                      variant="outline"
                                      className={`${badgeConfig.color} border text-xs w-full justify-center`}
                                    >
                                      {StatusIcon && (
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                      )}
                                      {invoice.status === "Needs Review"
                                        ? "Review"
                                        : invoice.bucket_name}
                                    </Badge>
                                  </>
                                ) : (
                                  // NORMAL VIEW - Full Card
                                  <>
                                    {/* Invoice ID */}
                                    <div className="mb-2">
                                      <span className="text-sm font-mono font-semibold text-slate-900">
                                        {invoice.po_id}
                                      </span>
                                    </div>

                                    {/* Vendor */}
                                    <div className="mb-2">
                                      <p className="text-sm font-medium text-slate-700">
                                        {invoice.extracted_json?.supplier?.name}
                                      </p>
                                      {invoice.po_id && (
                                        <p className="text-xs text-slate-500 mt-0.5">
                                          PO: {invoice.po_id}
                                        </p>
                                      )}
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-4">
                                      <p className="text-2xl font-bold text-slate-900">
                                        ${invoice.extracted_json?.summary?.grand_total?.toLocaleString()}
                                      </p>
                                    </div>

                                    {/* Status Badge - Full Width Button at Bottom */}
                                    <div className="mt-auto">
                                      <div
                                        className={`${badgeConfig.color} border rounded-md py-2 px-3 text-xs font-semibold text-center flex items-center justify-center gap-1.5`}
                                      >
                                        {StatusIcon && (
                                          <StatusIcon className="w-3.5 h-3.5" />
                                        )}
                                        {invoice.status === "Needs Review"
                                          ? "Review"
                                          : invoice.bucket_name}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}

                      {columnInvoices.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-sm">
                          No invoices
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
      {focusedView && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Document Viewer</DialogTitle>
            </DialogHeader>
            <div className="h-full overflow-hidden">
              {selectedInvoiceId && (
                <iframe
                  src={
                    createPageUrl("DocumentViewer") + `?id=${selectedInvoiceId}`
                  }
                  className="w-full h-full border-0"
                  title="Document Viewer"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
