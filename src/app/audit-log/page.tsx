"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface AuditLogType {
  id: string;
  entity_type?: string;
  entity_id?: string;
  action: string;
  performed_by?: string;
  notes?: string;
  previous_value?: string;
  new_value?: string;
  created_date: string;
}

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  // Fetch audit logs
  const { data: auditLogs = [], isLoading } = useQuery<AuditLogType[]>({
    queryKey: ["auditLogs"],
    queryFn: () =>
      base44.entities.AuditLog.list("-created_date", 100) as Promise<
        AuditLogType[]
      >,
  });

  // Calculate statistics
  const totalEvents = auditLogs.length;
  const todayEvents = auditLogs.filter((log) => {
    const logDate = new Date(log.created_date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;

  const thisWeekEvents = auditLogs.filter((log) => {
    const logDate = new Date(log.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  }).length;

  const criticalActions = auditLogs.filter(
    (log) => log.action === "delete" || log.action === "approve"
  ).length;

  // Get unique values for filters
  const entities = [...new Set(auditLogs.map((log) => log.entity_type))]
    .filter(Boolean)
    .sort();
  const actions = [...new Set(auditLogs.map((log) => log.action))]
    .filter(Boolean)
    .sort();
  const users = [...new Set(auditLogs.map((log) => log.performed_by))]
    .filter(Boolean)
    .sort();

  // Apply filters
  const filteredLogs = auditLogs.filter((log) => {
    const searchMatch =
      !searchQuery ||
      log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const entityMatch =
      entityFilter === "all" || log.entity_type === entityFilter;
    const actionMatch = actionFilter === "all" || log.action === actionFilter;
    const userMatch = userFilter === "all" || log.performed_by === userFilter;

    return searchMatch && entityMatch && actionMatch && userMatch;
  });

  const getActionBadgeColor = (action) => {
    const colors = {
      create: "bg-green-100 text-green-800 border-green-200",
      update: "bg-blue-100 text-blue-800 border-blue-200",
      delete: "bg-red-100 text-red-800 border-red-200",
      approve: "bg-purple-100 text-purple-800 border-purple-200",
      reject: "bg-orange-100 text-orange-800 border-orange-200",
      view: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return colors[action?.toLowerCase()] || colors.view;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete audit trail of all system activities
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Events</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {totalEvents}
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Today</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {todayEvents}
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">This Week</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {thisWeekEvents}
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Critical Actions</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">
              {criticalActions}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by entity ID, notes, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery ||
              entityFilter !== "all" ||
              actionFilter !== "all" ||
              userFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setEntityFilter("all");
                  setActionFilter("all");
                  setUserFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-white border border-slate-200">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {log.created_date
                          ? format(
                              new Date(log.created_date),
                              "MMM dd, yyyy HH:mm:ss"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.performed_by || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getActionBadgeColor(
                            log.action
                          )} border font-medium`}
                        >
                          {log.action || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.entity_type || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_id || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-md truncate">
                        {log.notes || "-"}
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
