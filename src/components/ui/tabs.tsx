"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = ({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
}: any) => {
  const [selectedValue, setSelectedValue] = React.useState(
    value || defaultValue,
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            selectedValue: selectedValue,
            onValueChange: handleChange,
          } as any);
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({
  children,
  selectedValue,
  onValueChange,
  className,
}: any) => (
  <div
    className={cn(
      "inline-flex h-12 items-center justify-start gap-1 border-b border-slate-200 w-full bg-white",
      className,
    )}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          selectedValue,
          onValueChange,
        } as any);
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({
  children,
  value,
  selectedValue,
  onValueChange,
  className,
}: any) => (
  <button
    type="button"
    onClick={() => onValueChange?.(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border-b-2 -mb-[2px]",
      selectedValue === value
        ? "text-blue-600 border-blue-600 bg-blue-50/50"
        : "text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300",
      className,
    )}
  >
    {children}
  </button>
);

const TabsContent = ({ children, value, selectedValue, className }: any) => {
  // 'value' is the tab identifier (e.g., "thresholds")
  // 'selectedValue' is passed from parent and indicates which tab is selected
  if (value !== selectedValue) return null;
  return <div className={className}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
