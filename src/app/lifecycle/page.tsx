"use client"

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import LifecycleChainCard from "@/components/lifecycle/LifecycleChainCard";
import LinkSuggestionDialog from "@/components/lifecycle/LinkSuggestionDialog";
import { detectDocumentLinks } from "@/components/lifecycle/linkDetection";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Filter,
  TrendingUp,
} from "lucide-react";

export default function Lifecycle() {
  const queryClient = useQueryClient();
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [suggestedLinks, setSuggestedLinks] = useState([]);
  const [expandedChains, setExpandedChains] = useState({});

  // Fetch all documents
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => base44.entities.Document.list("-created_date", 200),
  });

  // Fetch all links
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["documentLinks"],
    queryFn: () => base44.entities.DocumentLink.list("-created_date", 200),
  });

  // Fetch exceptions
  const { data: exceptions = [] } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.Exception.list("-created_date", 200),
  });

  // Create links mutation
  const createLinksMutation = useMutation({
    mutationFn: async (linksToCreate) => {
      const promises = linksToCreate.map(async (suggestion) => {
        const link = await base44.entities.DocumentLink.create({
          source_document_id: suggestion.sourceDoc.id,
          target_document_id: suggestion.targetDoc.id,
          link_type: suggestion.linkType,
          match_confidence: suggestion.confidence,
          status: suggestion.confidence >= 85 ? "Matched" : "Partial",
          mismatch_reason:
            suggestion.confidence < 85 ? suggestion.reason : null,
        });

        await base44.entities.AuditLog.create({
          entity_type: "Link",
          entity_id: link.id,
          action: "Linked",
          notes: `Auto-linked ${suggestion.sourceDoc.document_type} to ${suggestion.targetDoc.document_type} (${suggestion.confidence}% confidence)`,
        });

        return link;
      });

      return await Promise.all(promises);
    },
    onSuccess: (createdLinks) => {
      queryClient.invalidateQueries({ queryKey: ["documentLinks"] });
      toast.success(
        `Created ${createdLinks.length} document link${
          createdLinks.length !== 1 ? "s" : ""
        }`
      );
      setShowLinkDialog(false);
    },
    onError: () => {
      toast.error("Failed to create links");
    },
  });

  const handleSuggestLinks = () => {
    const detected = detectDocumentLinks(documents, links);
    setSuggestedLinks(detected);
    setShowLinkDialog(true);
  };

  const handleCreateLink = (selectedLinks) => {
    createLinksMutation.mutate(selectedLinks);
  };

  const isLoading = docsLoading || linksLoading;

  // Build lifecycle chains
  const lifecycleChains = useMemo(() => {
    const chains = {};

    // Group documents by vendor and attempt to link them
    documents.forEach((doc) => {
      const vendor = doc.vendor;
      if (!chains[vendor]) {
        chains[vendor] = [];
      }

      // Find if this document belongs to an existing chain
      let addedToChain = false;
      for (const chain of chains[vendor]) {
        // Check if this document links to any document in the chain
        const hasLink = links.some(
          (link) =>
            (link.source_document_id === doc.id &&
              chain.some((d) => d.id === link.target_document_id)) ||
            (link.target_document_id === doc.id &&
              chain.some((d) => d.id === link.source_document_id))
        );

        if (hasLink) {
          chain.push(doc);
          addedToChain = true;
          break;
        }
      }

      // If not added to any chain, create a new chain
      if (!addedToChain) {
        chains[vendor].push([doc]);
      }
    });

    // Sort documents within each chain by document type order
    const typeOrder = { PO: 0, ASN: 1, BOL: 2, POD: 3, Invoice: 4 };
    Object.keys(chains).forEach((vendor) => {
      chains[vendor].forEach((chain) => {
        chain.sort(
          (a, b) =>
            (typeOrder[a.document_type] || 99) -
            (typeOrder[b.document_type] || 99)
        );
      });
    });

    return chains;
  }, [documents, links]);

  // Filter and calculate status for each chain
  const filteredChains = useMemo(() => {
    const result = [];

    Object.entries(lifecycleChains).forEach(([vendor, chains]) => {
      if (vendorFilter !== "all" && vendor !== vendorFilter) return;

      chains.forEach((chain, index) => {
        // Calculate chain status
        const hasInvoice = chain.some((d) => d.document_type === "Invoice");
        const hasPO = chain.some((d) => d.document_type === "PO");
        const hasReceiving = chain.some(
          (d) =>
            d.document_type === "ASN" ||
            d.document_type === "BOL" ||
            d.document_type === "POD"
        );

        let status = "Incomplete";
        let matchType = null;

        if (hasPO && hasInvoice && !hasReceiving) {
          status = "Complete";
          matchType = "2-Way Match";
        } else if (hasPO && hasReceiving && hasInvoice) {
          status = "Complete";
          matchType = "3-Way Match";
        } else if (hasInvoice && !hasPO) {
          status = "Needs Review";
        }

        // Check for exceptions
        const chainDocIds = chain.map((d) => d.id);
        const chainExceptions = exceptions.filter((ex) =>
          chainDocIds.includes(ex.document_id)
        );
        if (chainExceptions.length > 0) {
          status = "Needs Review";
        }

        // Apply status filter
        if (statusFilter !== "all" && status !== statusFilter) return;

        // Apply search
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matches = chain.some(
            (d) =>
              d.reference_number?.toLowerCase().includes(searchLower) ||
              d.vendor?.toLowerCase().includes(searchLower) ||
              d.id.toLowerCase().includes(searchLower)
          );
          if (!matches) return;
        }

        result.push({
          id: `${vendor}-${index}`,
          vendor,
          chain,
          status,
          matchType,
          exceptions: chainExceptions,
          links: links.filter(
            (link) =>
              chainDocIds.includes(link.source_document_id) ||
              chainDocIds.includes(link.target_document_id)
          ),
        });
      });
    });

    return result;
  }, [
    lifecycleChains,
    vendorFilter,
    statusFilter,
    searchQuery,
    exceptions,
    links,
  ]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredChains.length;
    const complete = filteredChains.filter(
      (c) => c.status === "Complete"
    ).length;
    const needsReview = filteredChains.filter(
      (c) => c.status === "Needs Review"
    ).length;
    const incomplete = filteredChains.filter(
      (c) => c.status === "Incomplete"
    ).length;

    // Calculate STP Rate - chains that are complete with no exceptions
    const stpEligible = filteredChains.filter(
      (c) => c.status === "Complete" && c.exceptions.length === 0
    ).length;
    const stpRate = total > 0 ? Math.round((stpEligible / total) * 100) : 0;

    return { total, complete, needsReview, incomplete, stpRate };
  }, [filteredChains]);

  const vendors = useMemo(() => {
    return [...new Set(documents.map((d) => d.vendor))].sort();
  }, [documents]);

  const toggleChain = (chainId) => {
    setExpandedChains((prev) => ({
      ...prev,
      [chainId]: !prev[chainId],
    }));
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Document Lifecycle & Matching
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track document chains from PO to Invoice • 2-Way & 3-Way matching
            </p>
          </div>

          <Button
            onClick={handleSuggestLinks}
            disabled={createLinksMutation.isPending}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Sparkles className="w-4 h-4" />
            {createLinksMutation.isPending ? "Analyzing..." : "Suggest Links"}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />

            <Input
              placeholder="Search by PO, Invoice, Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />

            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Vendor" />
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
                <SelectItem value="Incomplete">Incomplete</SelectItem>
                <SelectItem value="Needs Review">Needs Review</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            {(vendorFilter !== "all" ||
              statusFilter !== "all" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVendorFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Total Chains
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.total}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-emerald-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    Fully Matched
                  </span>
                </div>
                <span className="text-2xl font-semibold text-emerald-900">
                  {stats.complete}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-amber-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">
                    Needs Review
                  </span>
                </div>
                <span className="text-2xl font-semibold text-amber-900">
                  {stats.needsReview}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-600">
                    Blocked
                  </span>
                </div>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.incomplete}
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    STP Rate
                  </span>
                </div>
                <span className="text-2xl font-semibold text-green-900">
                  {stats.stpRate}%
                </span>
              </div>
              <div className="text-[10px] text-green-600 mt-1">
                Auto-approved
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lifecycle Chains */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
        </div>
      ) : filteredChains.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500">
            {searchQuery || vendorFilter !== "all" || statusFilter !== "all"
              ? "No matching document chains found"
              : "No document chains available"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChains.map((chainData) => (
            <LifecycleChainCard
              key={chainData.id}
              chainData={chainData}
              expanded={expandedChains[chainData.id] || false}
              onToggle={() => toggleChain(chainData.id)}
            />
          ))}
        </div>
      )}

      {/* Link Suggestion Dialog */}
      <LinkSuggestionDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        suggestions={suggestedLinks}
        onCreateLinks={handleCreateLink}
        isCreating={createLinksMutation.isPending}
      />
    </div>
  );
}
