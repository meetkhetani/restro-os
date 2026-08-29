import * as React from "react";
import { ShoppingBag, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { RecentOrderRecord } from "@/domain/dashboard/types";
import { formatCurrency } from "@/lib/utils";

export function RecentOrdersSection({ orders }: { orders: RecentOrderRecord[] }) {
  const statusBadges = {
    preparing: <Badge variant="warning">In Kitchen</Badge>,
    ready: <Badge variant="brand">Ready for Pickup</Badge>,
    served: <Badge variant="success">Served</Badge>,
    delivered: <Badge variant="success">Delivered</Badge>,
    cancelled: <Badge variant="danger">Cancelled</Badge>,
  };

  return (
    <Card className="bg-surface border-restro-200 shadow-subtle">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center">
            <ShoppingBag className="h-4 w-4 text-brand-600 mr-2" />
            Live Orders Stream
          </CardTitle>
          <Badge variant="outline">Real-Time Sync</Badge>
        </div>
        <CardDescription>
          Active tickets placed across store registers and digital POS
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Ticket</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Guest Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-bold font-mono text-xs text-restro-900">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="text-xs text-restro-600">{order.branchName}</TableCell>
                <TableCell className="text-xs font-semibold">{order.customerName}</TableCell>
                <TableCell className="text-xs uppercase tracking-wider text-restro-500">
                  {order.orderType.replace("_", " ")}
                </TableCell>
                <TableCell className="text-xs font-extrabold text-restro-900">
                  {formatCurrency(order.totalAmount, "INR")}
                </TableCell>
                <TableCell>{statusBadges[order.status]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
