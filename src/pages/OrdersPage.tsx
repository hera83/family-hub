import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Afventer", variant: "outline" },
  processing: { label: "Behandles", variant: "secondary" },
  completed: { label: "Leveret", variant: "default" },
  cancelled: { label: "Annulleret", variant: "destructive" },
};

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: orderLines = [] } = useQuery({
    queryKey: ["order_lines", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data } = await supabase.from("order_lines").select("*").eq("order_id", selectedOrder).order("category_name");
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const groupedLines = useMemo(() => {
    const groups: Record<string, any[]> = {};
    orderLines.forEach((line: any) => {
      const cat = line.category_name || "Uden kategori";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(line);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [orderLines]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ordrer</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Ingen ordrer endnu</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Dato</th>
                <th className="text-left p-3 text-sm font-medium">Antal varer</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => {
                const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                return (
                  <tr
                    key={order.id}
                    className="border-t cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <td className="p-3 text-sm">{format(new Date(order.created_at), "d. MMM yyyy, HH:mm", { locale: da })}</td>
                    <td className="p-3 text-sm">{order.total_items} varer</td>
                    <td className="p-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ordredetaljer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {groupedLines.map(([category, lines]) => (
              <div key={category} className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category}</h3>
                {lines.map((line: any) => (
                  <div key={line.id} className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-sm">{line.product_name}</span>
                    <span className="text-sm text-muted-foreground">{line.quantity} {line.unit}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
