import React from "react";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ApprovalDetailDrawer({
  open,
  onOpenChange,
  approval,
  document,
  onApprove,
  onReject,
}) {
  const router = useRouter();

  // Fetch related documents (linked via DocumentLink)
  const { data: links = [] } = useQuery({
    queryKey: ["documentLinks", approval?.document_id],
    queryFn: async () => {
      if (!approval?.document_id) return [];
      const allLinks = await base44.entities.DocumentLink.list(
        "-created_date",
        100
      );
      return allLinks.filter(
        (link) =>
          link.source_document_id === approval.document_id ||
          link.target_document_id === approval.document_id
      );
    },
    enabled: open && !!approval?.document_id,
  });

  const { data: relatedDocs = [] } = useQuery({
    queryKey: ["relatedDocs", links],
    queryFn: async () => {
      if (!links || links.length === 0) return [];
      const docIds = [
        ...new Set(
          links.flatMap((l) => [l.source_document_id, l.target_document_id])
        ),
      ];
      const docs = await base44.entities.Document.list("-created_date", 200);
      return docs.filter(
        (d) => docIds.includes(d.id) && d.id !== approval?.document_id
      );
    },
    enabled: links.length > 0,
  });

  // Fetch exceptions related to this document
  const { data: exceptions = [] } = useQuery({
    queryKey: ["exceptions", approval?.document_id],
    queryFn: async () => {
      if (!approval?.document_id) return [];
      const allExceptions = await base44.entities.Exception.list(
        "-created_date",
        200
      );
      return allExceptions.filter(
        (ex) => ex.document_id === approval.document_id
      );
    },
    enabled: open && !!approval?.document_id,
  });

  // Fetch audit trail
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["auditLogs", approval?.id],
    queryFn: async () => {
      if (!approval?.id) return [];
      const logs = await base44.entities.AuditLog.list("-created_date", 50);
      return logs.filter(
        (log) =>
          log.entity_id === approval.id ||
          log.entity_id === approval.document_id
      );
    },
    enabled: open && !!approval?.id,
  });

  if (!approval) return null;

  const isException = approval.approval_type === "Exception";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-slate-200">
          <SheetTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-600" />
            Approval Details
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {/* Document Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {document?.reference_number || "Document"}
                </h3>
                <p className="text-sm text-slate-500">
                  {document?.document_type} from {document?.vendor}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(
                    createPageUrl("DocumentViewer") +
                      `?id=${approval.document_id}`
                  )
                }
                className="gap-2"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">Amount</div>
                <div className="text-lg font-semibold text-slate-900">
                  $
                  {(
                    approval.amount_threshold ||
                    document?.total_amount ||
                    0
                  ).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">SLA Remaining</div>
                <div className="text-lg font-semibold text-slate-900 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.max(
                    0,
                    Math.round(
                      4 -
                        (new Date() - new Date(approval.created_date)) /
                          (1000 * 60 * 60)
                    )
                  )}
                  h
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Approval Reason */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              Approval Reason
            </h4>
            <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
              {isException ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              ) : (
                <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
              )}
              <div>
                <div className="font-medium text-slate-900 mb-1">
                  {isException
                    ? "Exception Approval Required"
                    : "Threshold Approval"}
                </div>
                <div className="text-sm text-slate-600">
                  {isException
                    ? "Document flagged with exceptions requiring management review"
                    : `Amount exceeds standard approval threshold of $${(
                        approval.amount_threshold || 0
                      ).toLocaleString()}`}
                </div>
              </div>
            </div>
          </div>

          {/* Exceptions */}
          {exceptions.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Exceptions
                </h4>
                <div className="space-y-2">
                  {exceptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-rose-50 border border-rose-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant="outline"
                          className="bg-rose-100 text-rose-700 border-rose-300"
                        >
                          {ex.exception_type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            ex.severity === "High"
                              ? "bg-red-100 text-red-700 border-red-300"
                              : ex.severity === "Medium"
                              ? "bg-amber-100 text-amber-700 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }
                        >
                          {ex.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700">{ex.description}</p>
                      {ex.recommended_action && (
                        <p className="text-xs text-slate-600 mt-2">
                          <span className="font-medium">Recommended:</span>{" "}
                          {ex.recommended_action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Linked Documents */}
          {relatedDocs.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Linked Documents
                </h4>
                <div className="space-y-2">
                  {relatedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(
                          createPageUrl("DocumentViewer") + `?id=${doc.id}`
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {doc.reference_number || doc.id}
                          </div>
                          <div className="text-xs text-slate-500">
                            {doc.document_type} • {doc.vendor}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-700 border-emerald-300"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Audit Trail */}
          {auditLogs.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Audit Trail
                </h4>
                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="text-xs text-slate-600 flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                      <div className="flex-1">
                        <span className="font-medium">{log.action}</span> by{" "}
                        {log.performed_by}
                        <div className="text-slate-500 mt-0.5">
                          {new Date(log.created_date).toLocaleString()}
                        </div>
                        {log.notes && (
                          <div className="text-slate-600 mt-1">{log.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </ScrollArea>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 p-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onReject}
            className="flex-1 gap-2 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
          >
            <X className="w-4 h-4" />
            Reject
          </Button>
          <Button
            onClick={onApprove}
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="w-4 h-4" />
            Approve
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
