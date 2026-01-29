"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createPageUrl, axiosInstance } from "@/utils";
import { FileText, Upload, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusConfig = {
  Received: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
  },
  Processing: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
  },
  "Needs Review": {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  Linked: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Exception: {
    color: "bg-rose-100 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig["Received"];
  return (
    <Badge variant="outline" className={`${config.color} border font-medium`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-2`} />
      {status}
    </Badge>
  );
}

function ConfidenceScore({ score }) {
  let color = "text-emerald-600 bg-emerald-50";
  if (score < 70) color = "text-rose-600 bg-rose-50";
  else if (score < 85) color = "text-amber-600 bg-amber-50";

  return (
    <div
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {score}%
    </div>
  );
}

export default function Documents() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    document_type: "all",
    status: "all",
    vendor: "",
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/api/v1/invoice/invoices");
        console.log("Documents API response:", response.data);
        return response.data?.data || [];
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
  });

  // Get unique vendors for filter
  const vendors = [
    ...new Set(
      documents.map((d) => d.extracted_json?.supplier?.name).filter(Boolean),
    ),
  ].sort();

  // Apply filters
  const filteredDocuments = documents.filter((doc) => {
    if (filters.document_type !== "all" && filters.document_type !== "Invoice")
      return false;
    if (filters.status !== "all" && doc.bucket_name !== filters.status)
      return false;
    if (filters.vendor && doc.extracted_json?.supplier?.name !== filters.vendor)
      return false;
    return true;
  });

  const handleDocumentClick = (doc) => {
    router.push(createPageUrl("DocumentViewer") + `?id=${doc._id}`);
  };

  const hasActiveFilters =
    filters.document_type !== "all" ||
    filters.status !== "all" ||
    filters.vendor !== "";

  const clearFilters = () => {
    setFilters({
      document_type: "all",
      status: "all",
      vendor: "",
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredDocuments.length}{" "}
            {filteredDocuments.length === 1 ? "document" : "documents"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>

          <Select
            value={filters.document_type}
            onValueChange={(val) =>
              setFilters((f) => ({ ...f, document_type: val }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="PO">PO</SelectItem>
              <SelectItem value="ASN">ASN</SelectItem>
              <SelectItem value="BOL">BOL</SelectItem>
              <SelectItem value="POD">POD</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(val) => setFilters((f) => ({ ...f, status: val }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Needs Review">Needs Review</SelectItem>
              <SelectItem value="Linked">Linked</SelectItem>
              <SelectItem value="Exception">Exception</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.vendor}
            onValueChange={(val) => setFilters((f) => ({ ...f, vendor: val }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2 text-slate-500"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-700">
                Document Type
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Reference
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Vendor
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Date
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Status
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Confidence
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Source
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(8)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        No documents found
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {hasActiveFilters
                          ? "Try adjusting your filters"
                          : "Upload your first document to get started"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow
                  key={doc._id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-slate-600" />
                      </div>
                      Invoice
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-xs">
                    {doc.po_id || "—"}
                  </TableCell>
                  <TableCell className="text-slate-900">
                    {doc.extracted_json?.supplier?.name || "—"}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {doc.extracted_json?.invoice_metadata?.invoice_date
                      ? format(
                          new Date(
                            doc.extracted_json.invoice_metadata.invoice_date,
                          ),
                          "MMM d, yyyy",
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="text-slate-900 font-medium">
                    {doc.extracted_json?.summary?.grand_total
                      ? `${doc.extracted_json?.additional_info?.currency || "$"}${doc.extracted_json.summary.grand_total.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.bucket_name} />
                  </TableCell>
                  <TableCell>
                    <ConfidenceScore
                      score={doc.validation_result?.totals_accuracy || 0}
                    />
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">S3</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
