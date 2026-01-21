"use client"

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle,
  Filter,
  Clock,
  XCircle,
  Check,
  X,
  FileText,
  DollarSign,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import ApprovalDetailDrawer from "@/components/approvals/ApprovalDetailDrawer";
import { toast } from "sonner";

export default function Approvals() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const queryClient = useQueryClient();

  // Fetch approvals
  const { data: approvals = [], isLoading: approvalsLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: () => base44.entities.Approval.list("-created_date", 200),
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 200),
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Process approval mutation
  const processApprovalMutation = useMutation({
    mutationFn: async ({ approvalIds, decision, rationale }: any) => {
      const promises = approvalIds.map(async (approvalId) => {
        const updated = await base44.entities.Approval.update(approvalId, {
          decision,
          rationale,
          decision_timestamp: new Date().toISOString(),
        });

        await base44.entities.AuditLog.create({
          entity_type: "Approval",
          entity_id: approvalId,
          action: decision,
          notes: rationale || `Approval ${decision.toLowerCase()}`,
        });

        return updated;
      });
      return await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      const count = variables.approvalIds.length;
      const actionWord =
        variables.decision === "Approved" ? "approved" : "rejected";
      toast.success(`${count} approval${count > 1 ? "s" : ""} ${actionWord}`);
      setSelectedIds([]);
      setDrawerOpen(false);
    },
    onError: () => {
      toast.error("Failed to process approval");
    },
  });

  const handleApprove = (approvalId) => {
    processApprovalMutation.mutate({
      approvalIds: [approvalId],
      decision: "Approved",
      rationale: "Quick approved",
    });
  };

  const handleReject = (approvalId) => {
    processApprovalMutation.mutate({
      approvalIds: [approvalId],
      decision: "Rejected",
      rationale: "Quick rejected",
    });
  };

  const handleBulkApprove = () => {
    processApprovalMutation.mutate({
      approvalIds: selectedIds,
      decision: "Approved",
      rationale: "Bulk approved",
    });
  };

  const handleBulkReject = () => {
    processApprovalMutation.mutate({
      approvalIds: selectedIds,
      decision: "Rejected",
      rationale: "Bulk rejected",
    });
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingApprovals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingApprovals.map((a) => a.id));
    }
  };

  const isLoading = approvalsLoading || documentsLoading;

  // Map documents
  const docsById = useMemo(() => {
    const map = {};
    documents.forEach((doc) => {
      map[doc.id] = doc;
    });
    return map;
  }, [documents]);

  // Filter pending approvals
  const pendingApprovals = useMemo(() => {
    return approvals
      .filter((app) => app.decision === "Pending")
      .filter((app) => typeFilter === "all" || app.approval_type === typeFilter)
      .map((app) => ({
        ...app,
        document: docsById[app.document_id],
      }))
      .sort((a, b) => {
        // Exceptions first
        if (a.approval_type === "Exception" && b.approval_type !== "Exception")
          return -1;
        if (a.approval_type !== "Exception" && b.approval_type === "Exception")
          return 1;
        // Then by amount
        const amtA = (a as any).amount_threshold || 0;
        const amtB = (b as any).amount_threshold || 0;
        return amtB - amtA;
      });
  }, [approvals, typeFilter, docsById]);

  // Calculate SLA hours remaining (mock)
  const getSlaHours = (approval) => {
    const created = new Date(approval.created_date);
    const now = new Date();
    const hoursElapsed = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    const slaLimit = approval.approval_type === "Exception" ? 4 : 24;
    return Math.max(0, Math.round(slaLimit - hoursElapsed));
  };

  // Group approvals if needed
  const groupedApprovals = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", items: pendingApprovals }];

    const groups = {};
    pendingApprovals.forEach((app) => {
      let groupKey = "Other";
      if (groupBy === "vendor") {
        groupKey = app.document?.vendor || "Unknown";
      } else if (groupBy === "type") {
        groupKey = app.approval_type;
      } else if (groupBy === "amount") {
        const amt = (app as any).amount_threshold || 0;
        if (amt < 10000) groupKey = "< $10K";
        else if (amt < 50000) groupKey = "$10K - $50K";
        else if (amt < 100000) groupKey = "$50K - $100K";
        else groupKey = "> $100K";
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(app);
    });

    return Object.entries(groups).map(([key, items]) => ({ key, items }));
  }, [pendingApprovals, groupBy]);

  // Stats
  const stats = useMemo(
    () => ({
      pending: pendingApprovals.length,
      exceptions: pendingApprovals.filter(
        (a) => a.approval_type === "Exception"
      ).length,
      highValue: pendingApprovals.filter(
        (a) => ((a as any).amount_threshold || 0) > 50000
      ).length,
      atRisk: pendingApprovals.filter((a) => getSlaHours(a) <= 2).length,
    }),
    [pendingApprovals]
  );

  const handleRowClick = (approval) => {
    setSelectedApproval(approval);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Approval Inbox
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {stats.pending} pending • {stats.exceptions} exceptions requiring
              attention
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <>
                <span className="text-sm text-slate-600">
                  {selectedIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkApprove}
                  disabled={processApprovalMutation.isPending}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkReject}
                  disabled={processApprovalMutation.isPending}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject All
                </Button>
              </>
            )}

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Exception">Exceptions</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Override">Override</SelectItem>
                <SelectItem value="Escalation">Escalation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="vendor">Group by Vendor</SelectItem>
                <SelectItem value="type">Group by Type</SelectItem>
                <SelectItem value="amount">Group by Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pending</span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.pending}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-rose-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-rose-700">Exceptions</span>
                <span className="text-2xl font-semibold text-rose-900">
                  {stats.exceptions}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">High Value</span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.highValue}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">SLA At Risk</span>
                <span className="text-2xl font-semibold text-amber-900">
                  {stats.atRisk}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
      ) : pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Inbox Clear
          </h3>
          <p className="text-sm text-slate-500">
            All approvals have been processed
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {groupedApprovals.map((group: any) => (
            <div key={group.key}>
              {groupBy !== "none" && (
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <span className="text-sm font-medium text-slate-700">
                    {group.key}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    ({group.items.length})
                  </span>
                </div>
              )}

              <Table>
                {groupBy === "none" && (
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedIds.length === pendingApprovals.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Document</TableHead>
                      <TableHead className="font-semibold">Reason</TableHead>
                      <TableHead className="font-semibold text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold">SLA</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                )}

                <TableBody>
                  {group.items.map((approval) => {
                    const slaHours = getSlaHours(approval);
                    const isException = approval.approval_type === "Exception";
                    const isSelected = selectedIds.includes(approval.id);

                    return (
                      <TableRow
                        key={approval.id}
                        className={`cursor-pointer transition-colors ${
                          isException
                            ? "bg-rose-50/30 hover:bg-rose-50/50"
                            : "hover:bg-slate-50"
                        } ${isSelected ? "bg-blue-50" : ""}`}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (
                            target.closest("button") ||
                            target.closest('[role="checkbox"]')
                          )
                            return;
                          handleRowClick(approval);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(approval.id)}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-mono text-sm font-medium text-slate-900">
                                {approval.document?.reference_number ||
                                  approval.document_id}
                              </div>
                              <div className="text-xs text-slate-500">
                                {approval.document?.document_type} •{" "}
                                {approval.document?.vendor}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isException && (
                              <Badge
                                variant="outline"
                                className="bg-rose-100 text-rose-700 border-rose-300"
                              >
                                Exception
                              </Badge>
                            )}
                            <span className="text-sm text-slate-700">
                              {isException
                                ? "Requires exception approval"
                                : `Threshold: $${(
                                    approval.amount_threshold || 0
                                  ).toLocaleString()}`}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="font-semibold text-slate-900">
                            $
                            {(
                              approval.amount_threshold ||
                              approval.document?.total_amount ||
                              0
                            ).toLocaleString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              slaHours <= 2
                                ? "bg-amber-100 text-amber-700 border-amber-300"
                                : "bg-slate-100 text-slate-600 border-slate-300"
                            }
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {slaHours}h
                          </Badge>
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApprove(approval.id)}
                              disabled={processApprovalMutation.isPending}
                              className="h-8 px-3 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReject(approval.id)}
                              disabled={processApprovalMutation.isPending}
                              className="h-8 px-3 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <ApprovalDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        approval={selectedApproval}
        document={selectedApproval?.document}
        onApprove={() => handleApprove(selectedApproval.id)}
        onReject={() => handleReject(selectedApproval.id)}
      />
    </div>
  );
}
