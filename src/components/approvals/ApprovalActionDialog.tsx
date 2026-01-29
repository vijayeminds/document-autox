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
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function ApprovalActionDialog({
  open,
  onOpenChange,
  approval,
  action,
  onConfirm,
  isLoading,
}) {
  const [rationale, setRationale] = useState("");

  const handleConfirm = () => {
    onConfirm(rationale);
    setRationale("");
  };

  const configMap = {
    approve: {
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      title: "Approve Document",
      description: "Confirm approval and provide rationale",
      buttonText: "Approve",
      buttonClass: "bg-emerald-600 hover:bg-emerald-700",
    },
    reject: {
      icon: XCircle,
      iconColor: "text-rose-600",
      title: "Reject Document",
      description: "Provide reason for rejection",
      buttonText: "Reject",
      buttonClass: "bg-rose-600 hover:bg-rose-700",
    },
    override: {
      icon: AlertCircle,
      iconColor: "text-purple-600",
      title: "Override Approval",
      description: "Document justification for override",
      buttonText: "Override",
      buttonClass: "bg-purple-600 hover:bg-purple-700",
    },
  };

  const config = configMap[action] || configMap.approve;

  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Rationale{" "}
              {action === "reject" && <span className="text-rose-600">*</span>}
            </Label>
            <Textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={`Explain your decision...`}
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
              disabled={(action === "reject" && !rationale.trim()) || isLoading}
              className={config.buttonClass}
            >
              {isLoading ? "Processing..." : config.buttonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
