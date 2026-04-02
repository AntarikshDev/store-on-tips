import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders, ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const OrderList = () => {
  const navigate = useNavigate();
  const { orders, loading } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !o.order_number.toLowerCase().includes(q) &&
          !(o.customer_name || '').toLowerCase().includes(q) &&
          !(o.customer_phone || '').toLowerCase().includes(q)
        )
          return false;
      }
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, search, statusFilter]);

  const getStatusBadge = (status: string | null) => {
    const s = ORDER_STATUSES.find((st) => st.value === status);
    return s ? (
      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', s.color)}>
        {s.label}
      </span>
    ) : (
      <span className="text-xs text-muted-foreground">—</span>
    );
  };

  const getPaymentBadge = (status: string | null) => {
    const s = PAYMENT_STATUSES.find((st) => st.value === status);
    return s ? (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', s.color)}>
        {s.label}
      </span>
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <ShoppingCart className="h-7 w-7 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No orders yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Once your store is live and customers start buying, orders will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No orders match your filters.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border bg-card p-4 space-y-2 cursor-pointer active:bg-muted/50 transition-colors"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">#{order.order_number}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{order.customer_name || 'Walk-in'}</span>
                  <span className="font-medium">₹{order.total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                  {getPaymentBadge(order.payment_status)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                    <TableCell className="font-medium">#{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{order.customer_name || 'Walk-in'}</span>
                        {order.customer_phone && (
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{order.total ?? 0}</TableCell>
                    <TableCell className="text-center">{getPaymentBadge(order.payment_status)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderList;
