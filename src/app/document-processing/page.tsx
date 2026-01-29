"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import KanbanBoard from "@/components/processing/KanbanBoard";
import WorklistTable from "@/components/processing/WorklistTable";
import { axiosInstance } from "@/utils";

// Sample dataset - 18 invoices across different stages
const SAMPLE_INVOICES = [
  // Received (3)
  {
    id: "INV-2024-001",
    vendor: "Acme Corp",
    amount: 12450,
    po_number: "PO-9871",
    status: "Received",
    confidence: 0,
    step: "Awaiting Processing",
    sla_hours: 20,
    assignee: null,
  },
  {
    id: "INV-2024-002",
    vendor: "Office Depot",
    amount: 3280,
    po_number: "PO-9872",
    status: "Received",
    confidence: 0,
    step: "Awaiting Processing",
    sla_hours: 22,
    assignee: null,
  },
  {
    id: "INV-2024-003",
    vendor: "Global Supplies",
    amount: 8900,
    po_number: "PO-9873",
    status: "Received",
    confidence: 0,
    step: "Awaiting Processing",
    sla_hours: 18,
    assignee: null,
  },

  // Processing (4)
  {
    id: "INV-2024-004",
    vendor: "Tech Systems Inc",
    amount: 45000,
    po_number: "PO-9874",
    status: "Processing",
    confidence: 45,
    step: "OCR Extraction",
    sla_hours: 15,
    assignee: { name: "Sarah J.", initials: "SJ", color: "bg-blue-500" },
  },
  {
    id: "INV-2024-005",
    vendor: "Metro Logistics",
    amount: 19800,
    po_number: "PO-9875",
    status: "Processing",
    confidence: 67,
    step: "Data Validation",
    sla_hours: 12,
    assignee: { name: "Michael R.", initials: "MR", color: "bg-emerald-500" },
  },
  {
    id: "INV-2024-006",
    vendor: "BuildMart",
    amount: 28600,
    po_number: "PO-9876",
    status: "Processing",
    confidence: 78,
    step: "Field Extraction",
    sla_hours: 8,
    assignee: { name: "Sarah J.", initials: "SJ", color: "bg-blue-500" },
  },
  {
    id: "INV-2024-007",
    vendor: "SafeGuard Security",
    amount: 7200,
    po_number: "PO-9877",
    status: "Processing",
    confidence: 52,
    step: "OCR Extraction",
    sla_hours: 16,
    assignee: null,
  },

  // Review Needed (3)
  {
    id: "INV-2024-008",
    vendor: "Johnson & Co",
    amount: 15600,
    po_number: "PO-9878",
    status: "Needs Review",
    confidence: 72,
    step: "Awaiting Human Review",
    issue: "Low confidence",
    sla_hours: 2,
    assignee: { name: "Lisa K.", initials: "LK", color: "bg-purple-500" },
  },
  {
    id: "INV-2024-009",
    vendor: "Pacific Trading",
    amount: 34200,
    po_number: null,
    status: "Needs Review",
    confidence: 88,
    step: "Awaiting Human Review",
    issue: "Missing PO",
    sla_hours: 4,
    assignee: { name: "David M.", initials: "DM", color: "bg-amber-500" },
    exception_impact: 34200,
  },
  {
    id: "INV-2024-010",
    vendor: "Vertex Materials",
    amount: 21500,
    po_number: "PO-9880",
    status: "Needs Review",
    confidence: 76,
    step: "Awaiting Human Review",
    issue: "Quantity mismatch",
    sla_hours: -1,
    assignee: { name: "Sarah J.", initials: "SJ", color: "bg-blue-500" },
    exception_impact: 2100,
  },

  // Matched to Orders (3)
  {
    id: "INV-2024-011",
    vendor: "Sterling Industries",
    amount: 56700,
    po_number: "PO-9881",
    status: "Matched",
    confidence: 96,
    step: "3-Way Match Complete",
    sla_hours: 10,
    assignee: { name: "Michael R.", initials: "MR", color: "bg-emerald-500" },
  },
  {
    id: "INV-2024-012",
    vendor: "Alpha Enterprises",
    amount: 8950,
    po_number: "PO-9882",
    status: "Matched",
    confidence: 94,
    step: "2-Way Match Complete",
    sla_hours: 14,
    assignee: { name: "Lisa K.", initials: "LK", color: "bg-purple-500" },
  },
  {
    id: "INV-2024-013",
    vendor: "Midwest Wholesale",
    amount: 17800,
    po_number: "PO-9883",
    status: "Matched",
    confidence: 98,
    step: "3-Way Match Complete",
    sla_hours: 9,
    assignee: { name: "David M.", initials: "DM", color: "bg-amber-500" },
  },

  // Exceptions (3)
  {
    id: "INV-2024-014",
    vendor: "Premium Goods LLC",
    amount: 42300,
    po_number: "PO-9884",
    status: "Exception",
    confidence: 91,
    step: "Exception Review",
    issue: "Price variance",
    exception: "Price variance: Expected $38,000",
    sla_hours: 1,
    assignee: { name: "Sarah J.", initials: "SJ", color: "bg-blue-500" },
    exception_impact: 4300,
  },
  {
    id: "INV-2024-015",
    vendor: "Office Depot",
    amount: 3280,
    po_number: "PO-9872",
    status: "Exception",
    confidence: 99,
    step: "Exception Review",
    issue: "Duplicate",
    exception: "Duplicate of INV-2024-002",
    sla_hours: -3,
    assignee: { name: "Michael R.", initials: "MR", color: "bg-emerald-500" },
    exception_impact: 3280,
  },
  {
    id: "INV-2024-016",
    vendor: "Express Freight",
    amount: 9100,
    po_number: "PO-9886",
    status: "Exception",
    confidence: 87,
    step: "Exception Review",
    issue: "Missing POD",
    exception: "Proof of delivery not received",
    sla_hours: 6,
    assignee: { name: "Lisa K.", initials: "LK", color: "bg-purple-500" },
    exception_impact: 9100,
  },

  // Approved (2)
  {
    id: "INV-2024-017",
    vendor: "National Supply Co",
    amount: 31200,
    po_number: "PO-9887",
    status: "Approved",
    confidence: 99,
    step: "Approved for Payment",
    sla_hours: null,
    assignee: { name: "David M.", initials: "DM", color: "bg-amber-500" },
  },
  {
    id: "INV-2024-018",
    vendor: "Bright Solutions",
    amount: 12800,
    po_number: "PO-9888",
    status: "Approved",
    confidence: 97,
    step: "Posted to GL",
    sla_hours: null,
    assignee: { name: "Michael R.", initials: "MR", color: "bg-emerald-500" },
  },
];

export default function DocumentProcessing() {
  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' or 'table'
  const [vendorFilter, setVendorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedView, setFocusedView] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("kanban-focused-view");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);

  useEffect(() => {
    const getInvoices = async () => {
      try {
        const { data } = await axiosInstance.get("/api/v1/invoice/invoices");
        console.log("=== Invoice Data Received ===");
        console.log("Full response:", data);
        console.log("Data array:", data.data);
        console.log("Number of invoices:", data.data?.length);

        setInvoices(data.data || []);

        // Get unique vendors
        const vendors: string[] | any = [
          ...new Set(
            data.data?.map((inv) => inv?.extracted_json?.supplier?.name),
          ),
        ]
          .filter(Boolean)
          .sort();
        console.log("Vendors:", vendors);
        setVendors(vendors);

        // Set all invoices as filtered initially
        console.log("Setting filtered invoices:", data.data);
        setFilteredInvoices(data.data || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    getInvoices();
  }, []);

  // Persist focused view preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "kanban-focused-view",
        JSON.stringify(focusedView),
      );

      // Communicate focused mode to layout
      window.dispatchEvent(
        new CustomEvent("kanban-focused-mode", {
          detail: { focused: focusedView && viewMode === "kanban" },
        }),
      );
    }
  }, [focusedView, viewMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* View Toggle - Left Side */}
            {viewMode === "kanban" && (
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="focused-mode"
                  className="text-sm text-slate-600 cursor-pointer flex items-center gap-2"
                >
                  {focusedView ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                  {focusedView ? "Focused" : "Normal"}
                </Label>
                <Switch
                  id="focused-mode"
                  checked={focusedView}
                  onCheckedChange={setFocusedView}
                  className="data-[state=checked]:bg-slate-900"
                />
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900">
                AP Invoice Workflow — Kanban Board
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {filteredInvoices.length} invoice
                {filteredInvoices.length !== 1 ? "s" : ""} in pipeline
              </p>
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search Invoice ID or Vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {(vendorFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVendorFilter("all");
                    setSearchQuery("");
                  }}
                  className="h-9"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* View Mode Icons */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={`h-8 w-8 p-0 ${
                  viewMode === "table"
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-200"
                }`}
                title="Worklist View"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className={`h-8 w-8 p-0 ${
                  viewMode === "kanban"
                    ? "bg-white shadow-sm"
                    : "hover:bg-slate-200"
                }`}
                title="Kanban View"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-73px)] overflow-hidden">
        {viewMode === "kanban" ? (
          <KanbanBoard invoices={filteredInvoices} focusedView={focusedView} />
        ) : (
          <div className="p-6 h-full overflow-auto">
            <WorklistTable invoices={filteredInvoices} />
          </div>
        )}
      </div>
    </div>
  );
}
