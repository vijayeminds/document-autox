import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, AlertTriangle, Link2, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function LinkSuggestionDialog({
  open,
  onOpenChange,
  suggestions,
  onCreateLinks,
  isCreating,
}) {
  const [selectedLinks, setSelectedLinks] = useState([]);

  const toggleSelection = (suggestion) => {
    setSelectedLinks((prev) => {
      const exists = prev.some(
        (s) =>
          s.sourceDoc.id === suggestion.sourceDoc.id &&
          s.targetDoc.id === suggestion.targetDoc.id
      );

      if (exists) {
        return prev.filter(
          (s) =>
            !(
              s.sourceDoc.id === suggestion.sourceDoc.id &&
              s.targetDoc.id === suggestion.targetDoc.id
            )
        );
      } else {
        return [...prev, suggestion];
      }
    });
  };

  const handleCreate = () => {
    onCreateLinks(selectedLinks);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return "text-emerald-600 bg-emerald-50";
    if (confidence >= 70) return "text-amber-600 bg-amber-50";
    return "text-rose-600 bg-rose-50";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Suggested Document Links
          </DialogTitle>
          <DialogDescription>
            Review and approve AI-suggested links between documents
          </DialogDescription>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600">
              No new link suggestions found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              All possible links are already created
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => {
                const isSelected = selectedLinks.some(
                  (s) =>
                    s.sourceDoc.id === suggestion.sourceDoc.id &&
                    s.targetDoc.id === suggestion.targetDoc.id
                );

                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(suggestion)}
                        className="mt-1"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.linkType}
                            </Badge>
                            <Badge
                              className={`text-xs ${getConfidenceColor(
                                suggestion.confidence
                              )}`}
                            >
                              {suggestion.confidence}% Match
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                {suggestion.sourceDoc.document_type}
                              </Badge>
                              <span className="font-medium text-slate-900">
                                {suggestion.sourceDoc.reference_number}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {suggestion.sourceDoc.vendor}
                            </p>
                            {suggestion.sourceDoc.document_date && (
                              <p className="text-xs text-slate-500">
                                {format(
                                  new Date(suggestion.sourceDoc.document_date),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                {suggestion.targetDoc.document_type}
                              </Badge>
                              <span className="font-medium text-slate-900">
                                {suggestion.targetDoc.reference_number}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {suggestion.targetDoc.vendor}
                            </p>
                            {suggestion.targetDoc.document_date && (
                              <p className="text-xs text-slate-500">
                                {format(
                                  new Date(suggestion.targetDoc.document_date),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {suggestion.reason && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded p-2">
                            <AlertTriangle className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span>{suggestion.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-slate-600">
                {selectedLinks.length} of {suggestions.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={selectedLinks.length === 0 || isCreating}
                  className="gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {isCreating
                    ? "Creating..."
                    : `Create ${selectedLinks.length} Link${
                        selectedLinks.length !== 1 ? "s" : ""
                      }`}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
