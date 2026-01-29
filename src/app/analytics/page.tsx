"use client"

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  Filter,
  FileText,
  Target,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState("30");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");

  // Fetch all data
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 500),
  });

  const { data: exceptions = [], isLoading: exceptionsLoading } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.Exception.list("-created_date", 500),
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["approvals"],
    queryFn: () => base44.entities.Approval.list("-created_date", 500),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 500),
  });

  const isLoading = docsLoading || exceptionsLoading;

  // Filter data based on selections
  const filteredData = useMemo(() => {
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    let filtered = documents.filter((doc) => {
      const docDate = new Date(doc.created_date);
      if (docDate < cutoffDate) return false;
      if (vendorFilter !== "all" && doc.vendor !== vendorFilter) return false;
      if (docTypeFilter !== "all" && doc.document_type !== docTypeFilter)
        return false;
      return true;
    });

    return filtered;
  }, [documents, dateRange, vendorFilter, docTypeFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalInvoices = filteredData.filter(
      (d) => d.document_type === "Invoice"
    ).length;
    const linkedInvoices = filteredData.filter(
      (d) => d.document_type === "Invoice" && d.status === "Linked"
    ).length;
    const stpRate =
      totalInvoices > 0
        ? Math.round((linkedInvoices / totalInvoices) * 100)
        : 0;

    // Calculate average cycle time (mock calculation)
    const avgCycleTime = totalInvoices > 0 ? 4.2 : 0;

    // Manual touches (invoices needing review or exceptions)
    const manualTouches =
      filteredData.filter(
        (d) => d.status === "Needs Review" || d.status === "Exception"
      ).length / (totalInvoices || 1);

    // Total exception exposure
    const exceptionDocs = filteredData.filter((d) => d.status === "Exception");
    const exceptionExposure = exceptionDocs.reduce(
      (sum, doc) => sum + (doc.total_amount || 0),
      0
    );

    // Early payment discounts captured (mock)
    const discountsCaptured = totalInvoices * 125;

    return {
      invoicesProcessed: { value: totalInvoices, change: 12.3, trending: "up" },
      stpRate: { value: stpRate, change: 5.2, trending: "up" },
      avgCycleTime: { value: avgCycleTime, change: -8.1, trending: "down" },
      manualTouches: {
        value: manualTouches.toFixed(2),
        change: -15.4,
        trending: "down",
      },
      exceptionExposure: {
        value: exceptionExposure,
        change: 3.2,
        trending: "up",
      },
      discountsCaptured: {
        value: discountsCaptured,
        change: 22.1,
        trending: "up",
      },
    };
  }, [filteredData]);

  // Processing stages data
  const stagesData = useMemo(() => {
    return [
      {
        stage: "Received",
        avgTime: 0.2,
        invoices: filteredData.filter((d) => d.status === "Received").length,
      },
      {
        stage: "Extraction",
        avgTime: 0.8,
        invoices: filteredData.filter((d) => d.status === "Processing").length,
      },
      {
        stage: "Matching",
        avgTime: 1.5,
        invoices: filteredData.filter((d) => d.status === "Linked").length,
      },
      {
        stage: "Review",
        avgTime: 18.2,
        invoices: filteredData.filter((d) => d.status === "Needs Review")
          .length,
      },
      {
        stage: "Approval",
        avgTime: 8.5,
        invoices: approvals.filter((a) => a.decision === "Approved").length,
      },
      {
        stage: "Exception",
        avgTime: 24.7,
        invoices: filteredData.filter((d) => d.status === "Exception").length,
      },
    ];
  }, [filteredData, approvals]);

  // Exception analytics
  const exceptionAnalytics = useMemo(() => {
    const exceptionsByType: any = {};
    const exceptionsByVendor: any = {};

    exceptions.forEach((ex) => {
      // By type
      if (!exceptionsByType[ex.exception_type]) {
        exceptionsByType[ex.exception_type] = {
          count: 0,
          exposure: 0,
          avgResolutionDays: 0,
        };
      }
      exceptionsByType[ex.exception_type].count++;

      // Find document for this exception
      const doc = documents.find((d) => d.id === ex.document_id);
      if (doc) {
        exceptionsByType[ex.exception_type].exposure += doc.total_amount || 0;

        // By vendor
        if (!exceptionsByVendor[doc.vendor]) {
          exceptionsByVendor[doc.vendor] = {};
        }
        if (!exceptionsByVendor[doc.vendor][ex.exception_type]) {
          exceptionsByVendor[doc.vendor][ex.exception_type] = 0;
        }
        exceptionsByVendor[doc.vendor][ex.exception_type]++;
      }

      // Calculate resolution time
      if (ex.resolved_at) {
        const created = new Date(ex.created_date);
        const resolved = new Date(ex.resolved_at);
        const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        exceptionsByType[ex.exception_type].avgResolutionDays += days;
      }
    });

    // Calculate averages
    Object.keys(exceptionsByType).forEach((type) => {
      const count = exceptionsByType[type].count;
      if (count > 0) {
        exceptionsByType[type].avgResolutionDays =
          Math.round((exceptionsByType[type].avgResolutionDays / count) * 10) /
          10;
      }
    });

    return { byType: exceptionsByType, byVendor: exceptionsByVendor };
  }, [exceptions, documents]);

  // Vendor performance
  const vendorPerformance = useMemo(() => {
    const vendorStats: any = {};

    filteredData.forEach((doc) => {
      if (!vendorStats[doc.vendor]) {
        vendorStats[doc.vendor] = {
          name: doc.vendor,
          invoices: 0,
          autoApproved: 0,
          exceptions: 0,
          totalAmount: 0,
        };
      }

      vendorStats[doc.vendor].invoices++;
      vendorStats[doc.vendor].totalAmount += doc.total_amount || 0;

      if (doc.status === "Linked") {
        vendorStats[doc.vendor].autoApproved++;
      }

      if (doc.status === "Exception") {
        vendorStats[doc.vendor].exceptions++;
      }
    });

    // Calculate rates and sort
    return Object.values(vendorStats)
      .map((v: any) => ({
        ...v,
        autoApprovalRate:
          v.invoices > 0 ? Math.round((v.autoApproved / v.invoices) * 100) : 0,
        exceptionRate:
          v.invoices > 0 ? Math.round((v.exceptions / v.invoices) * 100) : 0,
        riskScore:
          v.invoices > 0 ? Math.round((v.exceptions / v.invoices) * 100) : 0,
      }))
      .sort((a: any, b: any) => b.autoApprovalRate - a.autoApprovalRate)
      .slice(0, 10);
  }, [filteredData]);

  // Financial impact
  const financialImpact = useMemo(() => {
    const duplicatePrevented =
      exceptions.filter((e) => e.exception_type === "Duplicate").length * 2500;
    const overpaymentAvoided =
      exceptions.filter((e) => e.exception_type === "Price Variance").length *
      1200;
    const chargebacksRecovered = 8750;
    const outstandingExposure = kpis.exceptionExposure.value;

    return {
      duplicatePrevented,
      overpaymentAvoided,
      chargebacksRecovered,
      outstandingExposure,
      netSavings:
        duplicatePrevented + overpaymentAvoided + chargebacksRecovered,
    };
  }, [exceptions, kpis]);

  // Compliance metrics
  const complianceMetrics = useMemo(() => {
    const totalInvoices = filteredData.filter(
      (d) => d.document_type === "Invoice"
    ).length;
    const withAuditTrail =
      auditLogs.length > 0 ? Math.min(95, totalInvoices * 0.98) : 0;
    const overrides = approvals.filter(
      (a) => a.approval_type === "Override"
    ).length;
    const policyViolations = exceptions.filter(
      (e) => e.severity === "High"
    ).length;

    return {
      auditTrailCoverage:
        totalInvoices > 0
          ? Math.round((withAuditTrail / totalInvoices) * 100)
          : 0,
      approvalOverrides: overrides,
      policyViolations: policyViolations,
      complianceScore: 94,
    };
  }, [filteredData, auditLogs, approvals, exceptions]);

  const vendors = useMemo(() => {
    return [...new Set(documents.map((d) => d.vendor))].sort();
  }, [documents]);

  const exceptionChartData = useMemo(() => {
    return Object.entries(exceptionAnalytics.byType).map(([type, data]: [string, any]) => ({
      name: type,
      count: data.count,
      exposure: data.exposure,
      avgDays: data.avgResolutionDays,
    }));
  }, [exceptionAnalytics]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-6 gap-4 mb-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
        </div>
        <Skeleton className="h-[400px] mb-6" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Analytics & Insights
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Executive visibility into AP performance, efficiency, and
              financial impact
            </p>
          </div>
        </div>

        {/* Global Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-48">
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

            <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="PO">PO</SelectItem>
                <SelectItem value="ASN">ASN</SelectItem>
              </SelectContent>
            </Select>

            {(vendorFilter !== "all" || docTypeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVendorFilter("all");
                  setDocTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Executive KPI Snapshot */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <KPICard
          title="Invoices Processed"
          value={kpis.invoicesProcessed.value.toLocaleString()}
          change={kpis.invoicesProcessed.change}
          trending={kpis.invoicesProcessed.trending}
          icon={FileText}
          subtitle="MTD"
        />
        <KPICard
          title="STP Rate"
          value={`${kpis.stpRate.value}%`}
          change={kpis.stpRate.change}
          trending={kpis.stpRate.trending}
          icon={Zap}
          subtitle="Auto-approved"
          highlight
        />
        <KPICard
          title="Avg Cycle Time"
          value={`${kpis.avgCycleTime.value}d`}
          change={kpis.avgCycleTime.change}
          trending={kpis.avgCycleTime.trending}
          icon={Clock}
          subtitle="Receipt to payment"
        />
        <KPICard
          title="Manual Touches"
          value={kpis.manualTouches.value}
          change={kpis.manualTouches.change}
          trending={kpis.manualTouches.trending}
          icon={Target}
          subtitle="Per invoice"
        />
        <KPICard
          title="Exception Exposure"
          value={`$${(kpis.exceptionExposure.value / 1000).toFixed(0)}K`}
          change={kpis.exceptionExposure.change}
          trending={kpis.exceptionExposure.trending}
          icon={AlertTriangle}
          subtitle="At risk"
          alert
        />
        <KPICard
          title="Discounts Captured"
          value={`$${(kpis.discountsCaptured.value / 1000).toFixed(0)}K`}
          change={kpis.discountsCaptured.change}
          trending={kpis.discountsCaptured.trending}
          icon={DollarSign}
          subtitle="Early payment"
          positive
        />
      </div>

      {/* 2. Processing Efficiency */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Processing Efficiency
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Average Time per Stage (hours)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stagesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                  }}
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                />
                <Bar dataKey="avgTime" radius={[4, 4, 0, 0]}>
                  {stagesData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.stage === "Review" || entry.stage === "Exception"
                          ? "#f87171"
                          : "#3b82f6"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-4">
              Invoice Volume by Stage
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stagesData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="invoices" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* 3. Exception Intelligence */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Exception Intelligence
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(createPageUrl("Exceptions"))}
          >
            View All Exceptions
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4 border border-rose-200">
            <p className="text-sm text-rose-700 mb-1">Total Exceptions</p>
            <p className="text-3xl font-bold text-rose-900">
              {exceptions.length}
            </p>
            <p className="text-xs text-rose-600 mt-2">
              {exceptions.filter((e) => e.severity === "High").length} high
              severity
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-700 mb-1">Avg Resolution Time</p>
            <p className="text-3xl font-bold text-amber-900">
              {Object.values(exceptionAnalytics.byType).length > 0
                ? Math.round(
                    (Object.values(exceptionAnalytics.byType) as any[]).reduce(
                      (sum: number, e: any) => sum + e.avgResolutionDays,
                      0
                    ) / Object.values(exceptionAnalytics.byType).length
                  )
                : 0}
              d
            </p>
            <p className="text-xs text-amber-600 mt-2">Below 5-day target</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Financial Exposure</p>
            <p className="text-3xl font-bold text-blue-900">
              ${(kpis.exceptionExposure.value / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-blue-600 mt-2">Pending resolution</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-4">Exceptions by Type</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={exceptionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="count" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-4">
              Financial Exposure by Exception Type
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={exceptionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="exposure" fill="#fb923c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Callout */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900 mb-1">
                AI-Powered Insight
              </p>
              <p className="text-sm text-purple-700">
                38% of price variances originate from 2 vendors — likely
                contract enforcement issue. Recommend vendor discussion to align
                on pricing terms.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Vendor Performance */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Vendor Performance Leaderboard
          </h3>
          <Users className="w-5 h-5 text-slate-400" />
        </div>

        <div className="space-y-3">
          {vendorPerformance.map((vendor, idx) => (
            <button
              key={vendor.name}
              onClick={() => {
                setVendorFilter(vendor.name);
              }}
              className="w-full bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <Badge
                      variant="outline"
                      className="bg-white text-slate-700 border-slate-300 text-xs"
                    >
                      #{idx + 1}
                    </Badge>
                    <span className="font-medium text-slate-900">
                      {vendor.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 flex-1">
                    <div>
                      <p className="text-xs text-slate-500">Invoices</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {vendor.invoices}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Auto-Approval Rate
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              vendor.autoApprovalRate >= 80
                                ? "bg-emerald-500"
                                : vendor.autoApprovalRate >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                            style={{ width: `${vendor.autoApprovalRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {vendor.autoApprovalRate}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Exception Rate</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          vendor.exceptionRate <= 5
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : vendor.exceptionRate <= 15
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-rose-100 text-rose-700 border-rose-300"
                        )}
                      >
                        {vendor.exceptionRate}%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Value</p>
                      <p className="text-sm font-semibold text-slate-900">
                        ${(vendor.totalAmount / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* 5. Financial Impact & Leakage Analysis */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Financial Impact & Savings
        </h3>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
            <p className="text-sm text-emerald-700 mb-1">Overpayment Avoided</p>
            <p className="text-2xl font-bold text-emerald-900">
              ${(financialImpact.overpaymentAvoided / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Duplicates Prevented</p>
            <p className="text-2xl font-bold text-blue-900">
              ${(financialImpact.duplicatePrevented / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-700 mb-1">
              Chargebacks Recovered
            </p>
            <p className="text-2xl font-bold text-purple-900">
              ${(financialImpact.chargebacksRecovered / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-700 mb-1">Net AP Savings</p>
            <p className="text-2xl font-bold text-green-900">
              ${(financialImpact.netSavings / 1000).toFixed(1)}K
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">
                Outstanding Exception Exposure
              </p>
              <p className="text-3xl font-bold text-slate-900">
                ${(financialImpact.outstandingExposure / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Requires immediate resolution
              </p>
            </div>
            <Button
              onClick={() => router.push(createPageUrl("Exceptions"))}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Resolve Exceptions
            </Button>
          </div>
        </div>
      </Card>

      {/* 6. Compliance & Audit Readiness */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Compliance & Audit Readiness
          </h3>
          <ShieldCheck className="w-5 h-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Audit Trail Coverage</p>
            <p className="text-3xl font-bold text-slate-900">
              {complianceMetrics.auditTrailCoverage}%
            </p>
            <Badge
              variant="outline"
              className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-300 text-xs"
            >
              Compliant
            </Badge>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Approval Overrides</p>
            <p className="text-3xl font-bold text-slate-900">
              {complianceMetrics.approvalOverrides}
            </p>
            <p className="text-xs text-slate-500 mt-2">Requires review</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Policy Violations</p>
            <p className="text-3xl font-bold text-slate-900">
              {complianceMetrics.policyViolations}
            </p>
            <Badge
              variant="outline"
              className="mt-2 bg-amber-100 text-amber-700 border-amber-300 text-xs"
            >
              Monitor
            </Badge>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Compliance Score</p>
            <p className="text-3xl font-bold text-slate-900">
              {complianceMetrics.complianceScore}
            </p>
            <Badge
              variant="outline"
              className="mt-2 bg-green-100 text-green-700 border-green-300 text-xs"
            >
              Excellent
            </Badge>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900 mb-1">
                SOX Compliance Status
              </p>
              <p className="text-sm text-green-700">
                All financial controls are operating effectively. Ready for
                internal and external audit.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  trending,
  icon: Icon,
  subtitle,
  highlight,
  alert,
  positive,
}: any) {
  const isPositive = trending === "up" ? change > 0 : change < 0;

  return (
    <Card
      className={cn(
        "p-4 hover:shadow-md transition-shadow",
        highlight &&
          "border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100",
        alert &&
          "border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100",
        positive &&
          "border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            highlight
              ? "bg-blue-600"
              : alert
              ? "bg-rose-600"
              : positive
              ? "bg-green-600"
              : "bg-slate-900"
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-600" />
          )}
          <span
            className={cn(
              "text-xs font-semibold",
              isPositive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-xs text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </Card>
  );
}
