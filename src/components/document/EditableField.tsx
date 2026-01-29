import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export default function EditableField({
  label,
  value,
  onChange,
  confidence,
  type = "text",
  disabled = false,
}) {
  const [isEdited, setIsEdited] = useState(false);

  const handleChange = (e) => {
    setIsEdited(true);
    onChange(e.target.value);
  };

  const getConfidenceConfig = () => {
    if (confidence >= 85) {
      return {
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        label: "High",
      };
    }
    if (confidence >= 70) {
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        label: "Medium",
      };
    }
    return {
      icon: AlertCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      label: "Low",
    };
  };

  const config = getConfidenceConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bg}`}
        >
          <Icon className={`w-3 h-3 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>
            {confidence}%
          </span>
        </div>
      </div>
      <Input
        type={type}
        value={value || ""}
        onChange={handleChange}
        disabled={disabled}
        className={isEdited ? "border-blue-300 bg-blue-50" : ""}
      />
      {isEdited && (
        <p className="text-xs text-blue-600 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-blue-600" />
          Modified
        </p>
      )}
    </div>
  );
}
