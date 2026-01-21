import React from "react";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure thresholds, roles, and preferences
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <SettingsIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          System Settings
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Configure confidence thresholds, approval workflows, user roles, and
          notification preferences.
        </p>
      </div>
    </div>
  );
}
