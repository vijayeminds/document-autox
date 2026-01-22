"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance, createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import DocumentPreview from "@/components/document/DocumentPreview";
import ExtractedFields from "@/components/document/ExtractedFields";
import MatchContext from "@/components/document/MatchContext";

const statusConfig = {
  Received: { color: "bg-blue-100 text-blue-800 border-blue-200" },
  Processing: { color: "bg-purple-100 text-purple-800 border-purple-200" },
  "Needs Review": { color: "bg-amber-100 text-amber-800 border-amber-200" },
  Linked: { color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  Exception: { color: "bg-rose-100 text-rose-800 border-rose-200" },
};

export default function DocumentViewer() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get document ID from URL - initialize immediately
  const urlParams = new URLSearchParams(window.location.search);
  const documentId = urlParams.get("id");

  const [editedDocument, setEditedDocument] = useState(null);
  const [editedLineItems, setEditedLineItems] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedHighlightId, setSelectedHighlightId] = useState(null);

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // User not authenticated
      }
    };
    const getDocumentDetails = async () =>{
      try{
        const {data} = await axiosInstance.get(`/api/v1/invoice/${documentId}`)
        console.log(data)
      }catch(err){
        console.log(err)
      }
    }
    getDocumentDetails()
    loadUser();
  }, []);

  // Fetch document
  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ id: documentId });
      return docs[0];
    },
    enabled: !!documentId,
  });

  // Fetch line items
  const { data: lineItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["lineItems", documentId],
    queryFn: () =>
      base44.entities.DocumentLineItem.filter({ document_id: documentId }),
    enabled: !!documentId,
  });

  // Fetch document links
  const { data: links = [] } = useQuery({
    queryKey: ["documentLinks", documentId],
    queryFn: async () => {
      const allLinks = await base44.entities.DocumentLink.list(
        "-created_date",
        100
      );
      return allLinks.filter(
        (link) =>
          link.source_document_id === documentId ||
          link.target_document_id === documentId
      );
    },
    enabled: !!documentId,
  });

  // Fetch related documents
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
      return docs.filter((d) => docIds.includes(d.id) && d.id !== documentId);
    },
    enabled: links.length > 0,
  });

  // Initialize edited state when data loads
  useEffect(() => {
    if (document) {
      setEditedDocument({ ...document });
    }
  }, [document]);

  useEffect(() => {
    if (lineItems.length > 0) {
      setEditedLineItems([...lineItems]);
    }
  }, [lineItems]);

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (updates) => {
      return await base44.entities.Document.update(documentId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["document", documentId]);
      queryClient.invalidateQueries(["documents"]);
    },
  });

  // Update line items mutation
  const updateLineItemsMutation = useMutation({
    mutationFn: async (items) => {
      // Update existing items and create new ones
      const promises = items.map((item) => {
        if (item.id) {
          return base44.entities.DocumentLineItem.update(item.id, item);
        } else {
          return base44.entities.DocumentLineItem.create({
            ...item,
            document_id: documentId,
          });
        }
      });
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["lineItems", documentId]);
    },
  });

  // Create audit log mutation
  const createAuditLogMutation = useMutation({
    mutationFn: async (logData) => {
      return await base44.entities.AuditLog.create(logData);
    },
  });

  const handleFieldUpdate = async (field, value) => {
    try {
      // Calculate new confidence (human correction boosts to 100%)
      const newConfidence = 100;
      const updates = {
        ...editedDocument,
        [field]: value,
        confidence_score: newConfidence,
        status: "Linked",
      };

      await updateDocumentMutation.mutateAsync(updates);

      // Create audit log
      await createAuditLogMutation.mutateAsync({
        entity_type: "Document",
        entity_id: documentId,
        action: "Updated",
        performed_by: user?.email || "system",
        notes: `Field "${field}" corrected by user`,
        previous_value: String(editedDocument[field]),
        new_value: String(value),
      });

      setEditedDocument(updates);

      // Show micro-toast
      toast.success("All changes saved", {
        position: "bottom-right",
        duration: 2000,
      });
    } catch (error) {
      toast.error("Failed to update field");
    }
  };

  const handleLineItemUpdate = async (itemId, updates) => {
    // Placeholder for line item updates
    toast.info("Line item editing coming soon");
  };

  const handleHighlightClick = (highlightId) => {
    setSelectedHighlightId(highlightId);
  };

  const handleFieldClick = (fieldId) => {
    setSelectedHighlightId(fieldId);
  };

  if (!documentId) {
    return (
      <div className="p-6 max-w-[1920px] mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(createPageUrl("Documents"))}
          className="gap-2 mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Button>
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No document ID provided</p>
        </div>
      </div>
    );
  }

  if (docLoading || itemsLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-[800px]" />
          <Skeleton className="h-[800px]" />
          <Skeleton className="h-[800px]" />
        </div>
      </div>
    );
  }

  if (!document || !editedDocument) {
    return (
      <div className="p-6 max-w-[1920px] mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(createPageUrl("Documents"))}
          className="gap-2 mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Button>
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500">Document not found</p>
        </div>
      </div>
    );
  }

  const statusStyle =
    statusConfig[editedDocument.status] || statusConfig["Received"];

  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(createPageUrl("Documents"))}
          className="gap-2 mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-slate-900">
                {editedDocument.document_type} — {editedDocument.vendor}
              </h1>
              <Badge
                variant="outline"
                className={`${statusStyle.color} border`}
              >
                {editedDocument.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Reference: {editedDocument.reference_number || "N/A"} •
              Confidence: {editedDocument.confidence_score}%
            </p>
          </div>
        </div>
      </div>

      {/* Three-Column Resizable Layout */}
      <div style={{ height: "calc(100vh - 200px)" }}>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Column 1: Document Preview */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <DocumentPreview
              document={editedDocument}
              selectedHighlightId={selectedHighlightId}
              onHighlightClick={handleHighlightClick}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Column 2: Extracted Fields */}
          <ResizablePanel defaultSize={35} minSize={30} maxSize={50}>
            <ExtractedFields
              document={editedDocument}
              lineItems={editedLineItems}
              selectedHighlightId={selectedHighlightId}
              onFieldClick={handleFieldClick}
              onFieldUpdate={handleFieldUpdate}
              onLineItemUpdate={handleLineItemUpdate}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Column 3: Match Context */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
            <MatchContext
              document={editedDocument}
              links={links}
              relatedDocs={relatedDocs}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
