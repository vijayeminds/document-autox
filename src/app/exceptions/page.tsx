"use client"

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  DollarSign,
  Clock,
  TrendingUp,
  FileX,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import ExceptionDetailDrawer from "@/components/exceptions/ExceptionDetailDrawer";
import PriceVarianceDrawer from "@/components/exceptions/PriceVarianceDrawer";
import MissingPODrawer from "@/components/exceptions/MissingPODrawer";
import DuplicateInvoiceDrawer from "@/components/exceptions/DuplicateInvoiceDrawer";

const severityConfig = {
  High: {
    color: "bg-rose-100 text-rose-800 border-rose-300",
    icon: XCircle,
    dotColor: "bg-rose-500",
  },
  Medium: {
    color: "bg-amber-100 text-amber-800 border-amber-300",
    icon: AlertTriangle,
    dotColor: "bg-amber-500",
  },
  Low: {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: AlertTriangle,
    dotColor: "bg-blue-500",
  },
};

const slaStatusConfig = {
  Breached: {
    color: "bg-rose-100 text-rose-700",
    label: "SLA Breached",
    pulse: true,
  },
  "At Risk": {
    color: "bg-amber-100 text-amber-700",
    label: "At Risk",
    pulse: false,
  },
  "On Track": {
    color: "bg-emerald-100 text-emerald-700",
    label: "On Track",
    pulse: false,
  },
};

export default function Exceptions() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch exceptions
  const { data: exceptions = [], isLoading } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.Exception.list("-created_date", 500),
  });

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 500),
  });

  // Group exceptions by type, severity, and SLA status
  const groupedExceptions = React.useMemo(() => {
    if (!exceptions.length) return [];

    const groups = {};

    exceptions.forEach((exception) => {
      // Determine SLA status (skip resolved exceptions)
      if (exception.status === "Resolved") return;

      const doc = documents.find((d) => d.id === exception.document_id);
      const slaStatus =
        exception.status === "Open"
          ? Math.random() > 0.7
            ? "Breached"
            : Math.random() > 0.5
            ? "At Risk"
            : "On Track"
          : "At Risk";

      const groupKey = `${exception.exception_type}|${exception.severity}|${slaStatus}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          exception_type: exception.exception_type,
          severity: exception.severity,
          sla_status: slaStatus,
          exceptions: [],
          document_count: 0,
          total_impact: 0,
          recommended_action: exception.recommended_action,
        };
      }

      groups[groupKey].exceptions.push(exception);
      groups[groupKey].document_count += 1;

      // Calculate impact
      if (doc?.total_amount) {
        groups[groupKey].total_impact += doc.total_amount;
      }
    });

    return Object.values(groups);
  }, [exceptions, documents]);

  // Apply filters
  const filteredGroups = groupedExceptions.filter((group) => {
    const typeMatch =
      typeFilter === "all" || group.exception_type === typeFilter;
    const severityMatch =
      severityFilter === "all" || group.severity === severityFilter;
    const slaMatch = slaFilter === "all" || group.sla_status === slaFilter;
    return typeMatch && severityMatch && slaMatch;
  });

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const openExceptions = exceptions.filter((e) => e.status !== "Resolved");
    const breachedCount = groupedExceptions
      .filter((g) => g.sla_status === "Breached")
      .reduce((sum, g) => sum + g.document_count, 0);
    const highImpactCount = groupedExceptions
      .filter((g) => g.total_impact > 50000)
      .reduce((sum, g) => sum + g.document_count, 0);
    const totalExposure = groupedExceptions.reduce(
      (sum, g) => sum + g.total_impact,
      0
    );

    // Calculate blocked payments (high severity exceptions)
    const blockedPayments = groupedExceptions
      .filter((g) => g.severity === "High")
      .reduce((sum, g) => sum + g.total_impact, 0);

    // Calculate average time to resolution (mock for now)
    const avgResolution = 4.2; // days

    return {
      openCount: openExceptions.length,
      breachedCount,
      highImpactCount,
      totalExposure,
      blockedPayments,
      avgResolution,
    };
  }, [groupedExceptions, exceptions]);

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setDrawerOpen(true);
  };

  const uniqueTypes = [...new Set(exceptions.map((e) => e.exception_type))];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Exception Management — System View
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Centralized triage and resolution for invoice processing exceptions
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-rose-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-rose-600" />
              <span className="text-2xl font-bold text-rose-900">
                {summaryStats.breachedCount}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">SLA Breached</p>
            <p className="text-xs text-slate-500 mt-1">
              Immediate action required
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <span className="text-2xl font-bold text-amber-900">
                {summaryStats.highImpactCount}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              High Dollar Impact
            </p>
            <p className="text-xs text-slate-500 mt-1">
              &gt;$50K grouped exposure
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-slate-600" />
              <span className="text-2xl font-bold text-slate-900">
                {summaryStats.openCount}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Total Open Exceptions
            </p>
            <p className="text-xs text-slate-500 mt-1">Across all types</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">
                {summaryStats.avgResolution}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Avg Time to Resolution
            </p>
            <p className="text-xs text-slate-500 mt-1">Days (rolling 30d)</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-rose-200 p-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span className="text-2xl font-bold text-rose-900">
                ${(summaryStats.blockedPayments / 1000).toFixed(0)}K
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Blocked Payments
            </p>
            <p className="text-xs text-slate-500 mt-1">High severity only</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">Filter by:</span>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Exception Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={slaFilter} onValueChange={setSlaFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="SLA Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SLA</SelectItem>
              <SelectItem value="Breached">Breached</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="On Track">On Track</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== "all" ||
            severityFilter !== "all" ||
            slaFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("all");
                setSeverityFilter("all");
                setSlaFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Exception Groups Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-semibold text-slate-700">
                Exception Type
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Severity
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                Document Type
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">
                Impacted Documents
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">
                Total Financial Exposure
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                SLA Status
              </TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">
                Primary Action
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-slate-500"
                >
                  No exception groups found
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group, index) => {
                const severityStyle =
                  severityConfig[group.severity] || severityConfig.Medium;
                const slaStyle =
                  slaStatusConfig[group.sla_status] ||
                  slaStatusConfig["On Track"];

                return (
                  <TableRow
                    key={index}
                    className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
                    onClick={() => handleGroupClick(group)}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            severityStyle.dotColor
                          } ${
                            group.sla_status === "Breached"
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-900">
                        {group.exception_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityStyle.color}>
                        {group.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-700">Invoice</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-slate-900">
                        {group.document_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold ${
                          group.total_impact > 50000
                            ? "text-rose-700"
                            : "text-slate-900"
                        }`}
                      >
                        ${group.total_impact.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${slaStyle.color} border ${
                          slaStyle.pulse ? "animate-pulse" : ""
                        }`}
                      >
                        {slaStyle.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupClick(group);
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Exception Detail Drawer */}
      {selectedGroup?.exception_type === "Price Variance" ? (
        <PriceVarianceDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          group={selectedGroup}
          documents={documents}
        />
      ) : selectedGroup?.exception_type === "Missing POD" ? (
        <MissingPODrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          group={selectedGroup}
          documents={documents}
        />
      ) : selectedGroup?.exception_type === "Duplicate" ? (
        <DuplicateInvoiceDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          group={selectedGroup}
          documents={documents}
        />
      ) : (
        <ExceptionDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          group={selectedGroup}
          documents={documents}
        />
      )}
    </div>
  );
}
