import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, FileText } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";

export default function OrdersPage() {
  const [pdfData, setPdfData] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const openPdf = (base64: string) => {
    setPdfData(base64);
  };

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
                <th className="text-left p-3 text-sm font-medium">Bestillingsdato</th>
                <th className="text-left p-3 text-sm font-medium">Samlet pris</th>
                <th className="text-left p-3 text-sm font-medium">Åben</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3 text-sm">{format(new Date(order.created_at), "d. MMM yyyy, HH:mm", { locale: da })}</td>
                  <td className="p-3 text-sm">
                    {order.total_price != null
                      ? `${Number(order.total_price).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr`
                      : "—"}
                  </td>
                  <td className="p-3">
                    {order.pdf_data ? (
                      <Button variant="outline" size="sm" onClick={() => openPdf(order.pdf_data)} className="gap-1 min-h-[36px]">
                        <FileText className="h-4 w-4" /> PDF
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Ingen PDF</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!pdfData} onOpenChange={() => setPdfData(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Ordrekvittering</DialogTitle></DialogHeader>
          {pdfData && (
            <iframe src={pdfData} className="w-full h-[70vh] border rounded" title="PDF" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
