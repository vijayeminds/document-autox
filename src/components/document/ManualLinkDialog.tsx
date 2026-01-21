import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Link2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const LINK_TYPES = {
  "PO-ASN": "PO_ASN",
  "ASN-BOL": "ASN_BOL",
  "BOL-POD": "BOL_POD",
  "POD-Invoice": "POD_Invoice",
  "PO-Invoice": "PO_Invoice",
};

export default function ManualLinkDialog({
  open,
  onOpenChange,
  currentDocument,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [linkType, setLinkType] = useState("");
  const queryClient = useQueryClient();

  const { data: allDocuments = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 200),
    enabled: open,
  });

  const { data: existingLinks = [] } = useQuery({
    queryKey: ["documentLinks"],
    queryFn: () => base44.entities.DocumentLink.list("-created_date", 200),
    enabled: open,
  });

  const createLinkMutation = useMutation({
    mutationFn: async (linkData) => {
      const link = await base44.entities.DocumentLink.create(linkData);
      await base44.entities.AuditLog.create({
        entity_type: "Link",
        entity_id: link.id,
        action: "Linked",
        notes: `Manually linked ${currentDocument.document_type} to ${selectedDoc.document_type}`,
      });
      return link;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentLinks"] });
      toast.success("Documents linked successfully");
      onOpenChange(false);
      setSelectedDoc(null);
      setLinkType("");
      setSearchQuery("");
    },
    onError: () => {
      toast.error("Failed to create link");
    },
  });

  // Filter documents (exclude current doc and already linked docs)
  const linkedDocIds = existingLinks
    .filter(
      (l) =>
        l.source_document_id === currentDocument.id ||
        l.target_document_id === currentDocument.id
    )
    .map((l) =>
      l.source_document_id === currentDocument.id
        ? l.target_document_id
        : l.source_document_id
    );

  const availableDocuments = allDocuments.filter(
    (doc) =>
      doc.id !== currentDocument.id &&
      !linkedDocIds.includes(doc.id) &&
      (searchQuery === "" ||
        doc.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.reference_number
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        doc.document_type?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateLink = () => {
    if (!selectedDoc || !linkType) return;

    createLinkMutation.mutate({
      source_document_id: currentDocument.id,
      target_document_id: selectedDoc.id,
      link_type: linkType,
      match_confidence: 100,
      status: "Matched",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link Document
          </DialogTitle>
          <DialogDescription>
            Select a document to link with {currentDocument.document_type}{" "}
            {currentDocument.reference_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by vendor, reference number, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Document List */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {availableDocuments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {searchQuery
                  ? "No documents match your search"
                  : "No available documents to link"}
              </div>
            ) : (
              <div className="divide-y">
                {availableDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full p-3 text-left transition-colors hover:bg-slate-50 ${
                      selectedDoc?.id === doc.id
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedDoc?.id === doc.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.document_type}
                            </Badge>
                            <span className="text-sm font-medium text-slate-900">
                              {doc.reference_number || "No ref"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{doc.vendor}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        {doc.document_date &&
                          format(new Date(doc.document_date), "MMM d, yyyy")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Link Type Selection */}
          {selectedDoc && (
            <div className="space-y-2">
              <Label>Link Type</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select link relationship" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LINK_TYPES).map(([label, value]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createLinkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLink}
              disabled={
                !selectedDoc || !linkType || createLinkMutation.isPending
              }
              className="gap-2"
            >
              <Link2 className="w-4 h-4" />
              {createLinkMutation.isPending ? "Creating..." : "Create Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
