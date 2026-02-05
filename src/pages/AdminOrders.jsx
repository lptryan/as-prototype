import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  XCircle,
  Truck,
  FileText,
  Loader2
} from 'lucide-react';

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundReason, setRefundReason] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
  });

  const refundMutation = useMutation({
    mutationFn: async ({ orderId, reason }) => {
      const order = orders.find(o => o.id === orderId);
      await base44.entities.Order.update(orderId, {
        status: 'refunded',
        refund_reason: reason,
        refund_amount: order.total_credits_used,
      });
      // Add credits back to user
      const users = await base44.entities.User.filter({ email: order.user_email });
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, {
          credit_balance: (users[0].credit_balance || 0) + (order.total_credits_used || 0),
        });
        await base44.entities.CreditTransaction.create({
          user_email: order.user_email,
          type: 'refund',
          amount: order.total_credits_used,
          campaign_id: order.campaign_id,
          description: `Refund for order #${orderId.slice(-8)}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order refunded');
      setRefundOrder(null);
      setRefundReason('');
    },
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by order ID or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="composing">Composing</SelectItem>
            <SelectItem value="printing">Printing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Order ID</TableHead>
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Pieces</TableHead>
              <TableHead className="font-semibold">Credits</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-slate-50">
                <TableCell className="font-mono text-sm">
                  #{order.id?.slice(-8).toUpperCase()}
                </TableCell>
                <TableCell className="text-slate-600">
                  {order.user_email}
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <StatusBadge status={order.status} size="sm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="composing">Composing</SelectItem>
                      <SelectItem value="printing">Printing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{order.total_pieces?.toLocaleString()}</TableCell>
                <TableCell className="font-medium">{order.total_credits_used?.toLocaleString()}</TableCell>
                <TableCell className="text-slate-500">
                  {format(new Date(order.created_date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!['refunded', 'cancelled'].includes(order.status) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => setRefundOrder(order)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              #{selectedOrder?.id?.slice(-8).toUpperCase()}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <StatusBadge status={selectedOrder.status} size="lg" />
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-semibold text-sm truncate">{selectedOrder.user_email}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Total Pieces</p>
                  <p className="font-semibold">{selectedOrder.total_pieces?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Credits Used</p>
                  <p className="font-semibold">{selectedOrder.total_credits_used?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Postcard Size</p>
                  <p className="font-semibold">{selectedOrder.postcard_size || '4x6'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-semibold">
                    {format(new Date(selectedOrder.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {selectedOrder.fusionpro_job_id && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">FusionPro Job ID</p>
                  <code className="text-sm">{selectedOrder.fusionpro_job_id}</code>
                </div>
              )}

              {selectedOrder.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{selectedOrder.error_message}</p>
                </div>
              )}

              {selectedOrder.tracking_imb?.length > 0 && (
                <div>
                  <Label className="mb-2 block">Tracking (IMB)</Label>
                  <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-auto">
                    {selectedOrder.tracking_imb.map((imb, i) => (
                      <code key={i} className="block text-xs font-mono">{imb}</code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Refund Dialog */}
      <AlertDialog open={!!refundOrder} onOpenChange={() => setRefundOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will refund {refundOrder?.total_credits_used?.toLocaleString()} credits to the user's account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label>Refund Reason</Label>
            <Textarea
              placeholder="Enter reason for refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => refundMutation.mutate({ orderId: refundOrder.id, reason: refundReason })}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}