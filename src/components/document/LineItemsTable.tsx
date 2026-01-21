import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function LineItemsTable({ items, onChange }) {
  const [lineItems, setLineItems] = useState(items || []);

  const handleFieldChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate total if quantity or unit_price changes
    if (field === "quantity" || field === "unit_price") {
      const qty =
        field === "quantity"
          ? parseFloat(value) || 0
          : parseFloat(updated[index].quantity) || 0;
      const price =
        field === "unit_price"
          ? parseFloat(value) || 0
          : parseFloat(updated[index].unit_price) || 0;
      updated[index].total_price = qty * price;
    }

    setLineItems(updated);
    onChange(updated);
  };

  const addLineItem = () => {
    const newItem = {
      sku: "",
      description: "",
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      confidence_score: 100,
      flagged: false,
    };
    const updated = [...lineItems, newItem];
    setLineItems(updated);
    onChange(updated);
  };

  const removeLineItem = (index) => {
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
    onChange(updated);
  };

  const getConfidenceIcon = (score) => {
    if (score >= 85)
      return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    if (score >= 70)
      return <AlertTriangle className="w-3 h-3 text-amber-600" />;
    return <AlertCircle className="w-3 h-3 text-rose-600" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Line Items</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addLineItem}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Line
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Qty</TableHead>
              <TableHead className="w-[120px]">Unit Price</TableHead>
              <TableHead className="w-[120px]">Total</TableHead>
              <TableHead className="w-[80px]">Conf.</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500 text-sm"
                >
                  No line items. Click "Add Line" to create one.
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item, index) => (
                <TableRow
                  key={index}
                  className={item.flagged ? "bg-amber-50" : ""}
                >
                  <TableCell>
                    <Input
                      value={item.sku || ""}
                      onChange={(e) =>
                        handleFieldChange(index, "sku", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="SKU"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description || ""}
                      onChange={(e) =>
                        handleFieldChange(index, "description", e.target.value)
                      }
                      className="h-8 text-xs"
                      placeholder="Description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleFieldChange(index, "quantity", e.target.value)
                      }
                      className="h-8 text-xs"
                      min="0"
                      step="1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) =>
                        handleFieldChange(index, "unit_price", e.target.value)
                      }
                      className="h-8 text-xs"
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    ${(item.total_price || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getConfidenceIcon(item.confidence_score)}
                      <span className="text-xs text-slate-600">
                        {item.confidence_score}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {lineItems.length > 0 && (
        <div className="flex justify-end pt-2 pr-4">
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Total Amount</p>
            <p className="text-lg font-semibold text-slate-900">
              $
              {lineItems
                .reduce((sum, item) => sum + (item.total_price || 0), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
