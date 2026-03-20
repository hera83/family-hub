import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/ordersApi";
import { qk } from "@/lib/api/queryKeys";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, FileText, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: ordersData } = useQuery({
    queryKey: qk.orders,
    queryFn: () => ordersApi.getAll(),
  });

  const orders = ordersData || [];
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const pagedOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deleteOrder = useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.orders }),
  });

  const openPdf = async (orderId: string) => {
    try {
      const res = await ordersApi.getPdf(orderId);
      setPdfData(res.pdf_data);
    } catch {
      setPdfData(null);
    }
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
                <th className="text-left p-3 text-sm font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order: any) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3 text-sm">{format(new Date(order.created_at), "d. MMM yyyy, HH:mm", { locale: da })}</td>
                  <td className="p-3 text-sm">
                    {order.total_price != null
                      ? `${Number(order.total_price).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr`
                      : "—"}
                  </td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" onClick={() => openPdf(order.id)} className="gap-1 min-h-[36px]">
                      <FileText className="h-4 w-4" /> PDF
                    </Button>
                  </td>
                  <td className="p-3">
                    <Button size="icon" variant="ghost" onClick={() => deleteOrder.mutate(order.id)} className="min-h-[36px] min-w-[36px] text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-[44px] min-w-[44px]">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">Side {page} af {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="min-h-[44px] min-w-[44px]">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      <Dialog open={!!pdfData} onOpenChange={() => setPdfData(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Ordrekvittering</DialogTitle>
            <DialogDescription>Vis den genererede PDF for denne ordre.</DialogDescription>
          </DialogHeader>
          {pdfData && (
            <iframe src={pdfData} className="w-full h-[70vh] border rounded" title="PDF" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
