import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

export default function ResolveExceptionDialog({
  open,
  onOpenChange,
  exception,
  onConfirm,
  isLoading,
}) {
  const [resolutionNotes, setResolutionNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(resolutionNotes);
    setResolutionNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Resolve Exception
          </DialogTitle>
          <DialogDescription>
            Document the resolution for this {exception?.exception_type}{" "}
            exception
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Resolution Notes</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this exception was resolved..."
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!resolutionNotes.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? "Resolving..." : "Resolve Exception"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
