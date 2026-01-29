"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Gauge,
  CheckCircle2,
  Users,
  Bell,
  Save,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  Mail,
  Smartphone,
  Shield,
  UserPlus,
  Trash2,
} from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Mock settings state (in production, this would come from a Settings entity)
  const [confidenceThresholds, setConfidenceThresholds] = useState({
    autoApprove: 95,
    needsReview: 75,
    autoReject: 50,
  });

  const [approvalWorkflow, setApprovalWorkflow] = useState({
    enableAutoApproval: true,
    highValueThreshold: 50000,
    exceptionRequiresApproval: true,
    multiLevelApproval: false,
    approvalSLA: 4, // hours
  });

  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    smsEnabled: false,
    exceptionAlerts: true,
    approvalReminders: true,
    slaBreachAlerts: true,
    dailyDigest: true,
  });

  const [slaSettings, setSlaSettings] = useState({
    documentProcessing: 24, // hours
    approvalResponse: 4, // hours
    exceptionResolution: 48, // hours
    invoiceMatching: 12, // hours
    paymentProcessing: 72, // hours
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("-created_date", 100),
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await base44.entities.User.update(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated");
    },
  });

  const handleSaveSettings = () => {
    // In production, save to Settings entity
    toast.success("Settings saved successfully");
    setHasChanges(false);
  };

  const handleThresholdChange = (key, value) => {
    setConfidenceThresholds((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleWorkflowChange = (key, value) => {
    setApprovalWorkflow((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleNotificationChange = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSlaChange = (key, value) => {
    setSlaSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              System Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure confidence thresholds, approval workflows, and system
              preferences
            </p>
          </div>
          {hasChanges && (
            <Button onClick={handleSaveSettings} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="thresholds" className="gap-2">
            <Gauge className="w-4 h-4" />
            Confidence Thresholds
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Approval Workflow
          </TabsTrigger>
          <TabsTrigger value="sla" className="gap-2">
            <Clock className="w-4 h-4" />
            SLA Settings
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Confidence Thresholds Tab */}
        <TabsContent value="thresholds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-600" />
                AI Confidence Thresholds
              </CardTitle>
              <CardDescription>
                Configure confidence score thresholds for automatic document
                processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-Approve Threshold */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-base font-medium">
                      Auto-Approve Threshold
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Documents with confidence above this will be automatically
                      approved
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-700 border-emerald-300"
                  >
                    {confidenceThresholds.autoApprove}%
                  </Badge>
                </div>
                <Slider
                  value={[confidenceThresholds.autoApprove]}
                  onValueChange={(value) =>
                    handleThresholdChange("autoApprove", value[0])
                  }
                  min={80}
                  max={100}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>80%</span>
                  <span>100%</span>
                </div>
              </div>

              <Separator />

              {/* Needs Review Threshold */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-base font-medium">
                      Needs Review Threshold
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Documents between this and auto-approve will need manual
                      review
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-700 border-amber-300"
                  >
                    {confidenceThresholds.needsReview}%
                  </Badge>
                </div>
                <Slider
                  value={[confidenceThresholds.needsReview]}
                  onValueChange={(value) =>
                    handleThresholdChange("needsReview", value[0])
                  }
                  min={60}
                  max={90}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>60%</span>
                  <span>90%</span>
                </div>
              </div>

              <Separator />

              {/* Auto-Reject Threshold */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-base font-medium">
                      Auto-Reject Threshold
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Documents below this will be automatically rejected for
                      re-processing
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-rose-100 text-rose-700 border-rose-300"
                  >
                    {confidenceThresholds.autoReject}%
                  </Badge>
                </div>
                <Slider
                  value={[confidenceThresholds.autoReject]}
                  onValueChange={(value) =>
                    handleThresholdChange("autoReject", value[0])
                  }
                  min={30}
                  max={70}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>30%</span>
                  <span>70%</span>
                </div>
              </div>

              <Separator />

              {/* Visual Range Display */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Processing Rules
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-slate-700">
                      {confidenceThresholds.autoApprove}% - 100%: Auto-approve
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-slate-700">
                      {confidenceThresholds.needsReview}% -{" "}
                      {confidenceThresholds.autoApprove - 1}%: Manual review
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-sm text-slate-700">
                      0% - {confidenceThresholds.autoReject}%: Auto-reject
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Approval Workflow Configuration
              </CardTitle>
              <CardDescription>
                Define approval rules and escalation policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Auto-Approval */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium">
                    Enable Auto-Approval
                  </Label>
                  <p className="text-sm text-slate-500 mt-1">
                    Automatically approve documents that meet confidence
                    thresholds
                  </p>
                </div>
                <Switch
                  checked={approvalWorkflow.enableAutoApproval}
                  onCheckedChange={(checked) =>
                    handleWorkflowChange("enableAutoApproval", checked)
                  }
                />
              </div>

              <Separator />

              {/* High-Value Threshold */}
              <div>
                <Label className="text-base font-medium">
                  High-Value Document Threshold
                </Label>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Documents above this amount require manager approval
                  regardless of confidence
                </p>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    value={approvalWorkflow.highValueThreshold}
                    onChange={(e) =>
                      handleWorkflowChange(
                        "highValueThreshold",
                        parseInt(e.target.value),
                      )
                    }
                    className="max-w-xs"
                  />
                </div>
              </div>

              <Separator />

              {/* Exception Approval */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Exceptions Require Approval
                  </Label>
                  <p className="text-sm text-slate-500 mt-1">
                    All documents with exceptions must be manually reviewed
                  </p>
                </div>
                <Switch
                  checked={approvalWorkflow.exceptionRequiresApproval}
                  onCheckedChange={(checked) =>
                    handleWorkflowChange("exceptionRequiresApproval", checked)
                  }
                />
              </div>

              <Separator />

              {/* Multi-Level Approval */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Multi-Level Approval
                  </Label>
                  <p className="text-sm text-slate-500 mt-1">
                    Require multiple approvals for high-value or high-risk
                    documents
                  </p>
                </div>
                <Switch
                  checked={approvalWorkflow.multiLevelApproval}
                  onCheckedChange={(checked) =>
                    handleWorkflowChange("multiLevelApproval", checked)
                  }
                />
              </div>

              <Separator />

              {/* Approval SLA */}
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  Approval SLA (Hours)
                </Label>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Target time for approval decisions
                </p>
                <Input
                  type="number"
                  value={approvalWorkflow.approvalSLA}
                  onChange={(e) =>
                    handleWorkflowChange(
                      "approvalSLA",
                      parseInt(e.target.value),
                    )
                  }
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Settings Tab */}
        <TabsContent value="sla" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                SLA Configuration
              </CardTitle>
              <CardDescription>
                Configure Service Level Agreement timelines for document processing stages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Processing SLA */}
              <div>
                <Label className="text-base font-medium">
                  Document Processing SLA (Hours)
                </Label>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Maximum time allowed for initial document processing and data extraction
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={slaSettings.documentProcessing}
                    onChange={(e) =>
                      handleSlaChange("documentProcessing", parseInt(e.target.value))
                    }
                    className="max-w-xs"
                    min="1"
                  />
                  <span className="text-sm text-slate-500">hours</span>
                </div>
              </div>

              <Separator />

              {/* Approval Response SLA */}
              <div>
                <Label className="text-base font-medium">
                  Approval Response SLA (Hours)
                </Label>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Target time for users to respond to approval requests
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={slaSettings.approvalResponse}
                    onChange={(e) =>
                      handleSlaChange("approvalResponse", parseInt(e.target.value))
                    }
                    className="max-w-xs"
                    min="1"
                  />
                  <span className="text-sm text-slate-500">hours</span>
                </div>
              </div>

              <Separator />

              {/* Exception Resolution SLA */}
              <div>
                <Label className="text-base font-medium">
                  Exception Resolution SLA (Hours)
                </Label>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Maximum time allowed to resolve document exceptions
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={slaSettings.exceptionResolution}
                    onChange={(e) =>
                      handleSlaChange("exceptionResolution", parseInt(e.target.value))
                    }
                    className="max-w-xs"
                    min="1"
                  />
                  <span className="text-sm text-slate-500">hours</span>
                </div>
              </div>

              <Separator />

              {/* Invoice Matching SLA */}
              <div>
                <Label className="text-base font-medium">
                  Invoice Matching SLA (Hours)
                </Label>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Target time for matching invoices with purchase orders
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={slaSettings.invoiceMatching}
                    onChange={(e) =>
                      handleSlaChange("invoiceMatching", parseInt(e.target.value))
                    }
                    className="max-w-xs"
                    min="1"
                  />
                  <span className="text-sm text-slate-500">hours</span>
                </div>
              </div>

              <Separator />

              {/* Payment Processing SLA */}
              <div>
                <Label className="text-base font-medium">
                  Payment Processing SLA (Hours)
                </Label>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Maximum time from approval to payment initiation
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={slaSettings.paymentProcessing}
                    onChange={(e) =>
                      handleSlaChange("paymentProcessing", parseInt(e.target.value))
                    }
                    className="max-w-xs"
                    min="1"
                  />
                  <span className="text-sm text-slate-500">hours</span>
                </div>
              </div>

              <Separator />

              {/* SLA Summary */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  SLA Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Document Processing</span>
                    <span className="font-medium">{slaSettings.documentProcessing}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Approval Response</span>
                    <span className="font-medium">{slaSettings.approvalResponse}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Exception Resolution</span>
                    <span className="font-medium">{slaSettings.exceptionResolution}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Invoice Matching</span>
                    <span className="font-medium">{slaSettings.invoiceMatching}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Payment Processing</span>
                    <span className="font-medium">{slaSettings.paymentProcessing}h</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-900 font-semibold">Total End-to-End</span>
                    <span className="font-bold text-blue-600">
                      {slaSettings.documentProcessing + 
                       slaSettings.approvalResponse + 
                       slaSettings.exceptionResolution + 
                       slaSettings.invoiceMatching + 
                       slaSettings.paymentProcessing}h
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Roles Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Role Management
              </CardTitle>
              <CardDescription>
                Manage user access levels and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Role Legend */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Role Permissions
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-700 border-purple-300"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                      <span className="text-slate-600">
                        Full system access, user management, settings
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-700 border-blue-300"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        User
                      </Badge>
                      <span className="text-slate-600">
                        Process documents, review exceptions, approvals
                      </span>
                    </div>
                  </div>
                </div>

                {/* User List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3">
                          User
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3">
                          Email
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3">
                          Role
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-700 px-4 py-3">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-slate-700">
                                  {user.full_name
                                    ?.substring(0, 2)
                                    .toUpperCase() || "U"}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {user.full_name || "User"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={user.role}
                              onValueChange={(role) =>
                                updateUserRole.mutate({ userId: user.id, role })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                  </div>
                                </SelectItem>
                                <SelectItem value="user">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3 h-3" />
                                    User
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {new Date(user.created_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure alerts and notification channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <Label className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Receive alerts via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.emailEnabled}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("emailEnabled", checked)
                  }
                />
              </div>

              <Separator />

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <Label className="text-base font-medium">
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-slate-500 mt-1">
                      Receive critical alerts via SMS
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.smsEnabled}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("smsEnabled", checked)
                  }
                />
              </div>

              <Separator />

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">
                  Alert Types
                </h4>
                <div className="space-y-4">
                  {/* Exception Alerts */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-slate-700">
                        Exception Alerts
                      </span>
                    </div>
                    <Switch
                      checked={notifications.exceptionAlerts}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("exceptionAlerts", checked)
                      }
                    />
                  </div>

                  {/* Approval Reminders */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-slate-700">
                        Approval Reminders
                      </span>
                    </div>
                    <Switch
                      checked={notifications.approvalReminders}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("approvalReminders", checked)
                      }
                    />
                  </div>

                  {/* SLA Breach Alerts */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span className="text-sm text-slate-700">
                        SLA Breach Alerts
                      </span>
                    </div>
                    <Switch
                      checked={notifications.slaBreachAlerts}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("slaBreachAlerts", checked)
                      }
                    />
                  </div>

                  {/* Daily Digest */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-slate-700">
                        Daily Digest
                      </span>
                    </div>
                    <Switch
                      checked={notifications.dailyDigest}
                      onCheckedChange={(checked) =>
                        handleNotificationChange("dailyDigest", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
