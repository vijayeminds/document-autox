"use client";

import React, { useState } from "react";
import { DollarSign, FileText, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sample data - in production this would come from the backend
const SAMPLE_CHARGEBACKS = [
  {
    id: "CB-001",
    rule_type: "Duplicate Payment",
    impacted_docs: 2,
    recovery_value: 12450,
    status: "Under Review",
    avg_days_open: 5,
    top_vendor: "Acme Corp",
  },
  {
    id: "CB-002",
    rule_type: "Price Variance",
    impacted_docs: 1,
    recovery_value: 4300,
    status: "Approved",
    avg_days_open: 12,
    top_vendor: "Tech Systems Inc",
  },
  {
    id: "CB-003",
    rule_type: "Overpayment",
    impacted_docs: 3,
    recovery_value: 8900,
    status: "Pending",
    avg_days_open: 3,
    top_vendor: "Global Supplies",
  },
];

export default function Chargebacks() {
  const [ruleTypeFilter, setRuleTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Calculate statistics
  const totalRecoverable = SAMPLE_CHARGEBACKS.reduce(
    (sum, cb) => sum + cb.recovery_value,
    0
  );
  const candidateCount = SAMPLE_CHARGEBACKS.filter(
    (cb) => cb.status === "Pending"
  ).length;
  const avgDaysToRecovery =
    SAMPLE_CHARGEBACKS.length > 0
      ? Math.round(
          SAMPLE_CHARGEBACKS.reduce((sum, cb) => sum + cb.avg_days_open, 0) /
            SAMPLE_CHARGEBACKS.length
        )
      : 0;

  // Get unique vendors
  const topVendors = [
    ...new Set(SAMPLE_CHARGEBACKS.map((cb) => cb.top_vendor)),
  ];
  const topOffendingVendor = topVendors.length > 0 ? topVendors[0] : "N/A";
  const incidentCount = SAMPLE_CHARGEBACKS.filter(
    (cb) => cb.top_vendor === topOffendingVendor
  ).length;

  // Apply filters
  const filteredChargebacks = SAMPLE_CHARGEBACKS.filter((cb) => {
    const ruleMatch =
      ruleTypeFilter === "all" || cb.rule_type === ruleTypeFilter;
    const statusMatch = statusFilter === "all" || cb.status === statusFilter;
    return ruleMatch && statusMatch;
  });

  const getStatusBadgeColor = (status) => {
    const colors = {
      "Under Review": "bg-blue-100 text-blue-800 border-blue-200",
      Approved: "bg-green-100 text-green-800 border-green-200",
      Pending: "bg-amber-100 text-amber-800 border-amber-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Chargebacks & Recoveries
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Document-based recovery opportunities • 0 active buckets
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Recoverable</p>
                <p className="text-xs text-slate-500">Available to recover</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              ${(totalRecoverable / 1000).toFixed(0)}K
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Chargeback Candidates
                </p>
                <p className="text-xs text-slate-500">Documents eligible</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {candidateCount}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Avg Days to Recovery
                </p>
                <p className="text-xs text-slate-500">Processing time</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {avgDaysToRecovery}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Top Offending Vendor
                </p>
                <p className="text-xs text-slate-500">
                  {incidentCount} incidents
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-lg font-semibold text-slate-900 truncate">
              {topOffendingVendor}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 font-medium">
              Filter by:
            </span>
            <Select value={ruleTypeFilter} onValueChange={setRuleTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Rule Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rule Types</SelectItem>
                <SelectItem value="Duplicate Payment">
                  Duplicate Payment
                </SelectItem>
                <SelectItem value="Price Variance">Price Variance</SelectItem>
                <SelectItem value="Overpayment">Overpayment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-white border border-slate-200">
          {filteredChargebacks.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                No chargeback opportunities found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Type</TableHead>
                    <TableHead>Impacted Docs</TableHead>
                    <TableHead>Recovery Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Avg Days Open</TableHead>
                    <TableHead>Top Vendor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChargebacks.map((chargeback) => (
                    <TableRow
                      key={chargeback.id}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <TableCell className="font-medium">
                        {chargeback.rule_type}
                      </TableCell>
                      <TableCell>{chargeback.impacted_docs}</TableCell>
                      <TableCell className="font-semibold text-emerald-700">
                        ${chargeback.recovery_value.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusBadgeColor(
                            chargeback.status
                          )} border font-medium`}
                        >
                          {chargeback.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{chargeback.avg_days_open}</TableCell>
                      <TableCell className="text-slate-700">
                        {chargeback.top_vendor}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
