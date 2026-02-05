import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { format } from 'date-fns';
import {
  Search,
  FileText,
  Filter,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusIcons = {
  pending: Clock,
  composing: Package,
  printing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: FileText,
  refunded: FileText,
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-lookup'],
    queryFn: () => base44.entities.Campaign.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const campaignLookup = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  const filteredOrders = orders.filter(order => {
    const campaign = campaignLookup[order.campaign_id];
    const matchesSearch = campaign?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search orders..."
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
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No orders found"
          description={searchQuery || statusFilter !== 'all' 
            ? "Try adjusting your filters"
            : "When you complete a campaign, your orders will appear here"
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Campaign</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Pieces</TableHead>
                <TableHead className="font-semibold">Credits</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const campaign = campaignLookup[order.campaign_id];
                const StatusIcon = statusIcons[order.status] || Clock;
                
                return (
                  <TableRow 
                    key={order.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell>
                      <span className="font-mono text-sm text-slate-600">
                        #{order.id?.slice(-8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                          <StatusIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {campaign?.name || 'Unknown Campaign'}
                          </p>
                          <p className="text-sm text-slate-500">{order.postcard_size || '4x6'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-900">{(order.total_pieces || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-900">
                        {(order.total_credits_used || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-500">
                        {format(new Date(order.created_date), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              Order #{selectedOrder?.id?.slice(-8).toUpperCase()}
            </SheetDescription>
          </SheetHeader>
          
          {selectedOrder && (
            <div className="mt-6 space-y-6">
              {/* Status Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Status</h4>
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedOrder.status} size="lg" />
                  {selectedOrder.estimated_delivery_date && (
                    <span className="text-sm text-slate-500">
                      Est. delivery: {format(new Date(selectedOrder.estimated_delivery_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                
                {/* Progress steps */}
                <div className="flex items-center gap-2 mt-4">
                  {['pending', 'composing', 'printing', 'shipped', 'delivered'].map((step, i) => {
                    const steps = ['pending', 'composing', 'printing', 'shipped', 'delivered'];
                    const currentIndex = steps.indexOf(selectedOrder.status);
                    const isComplete = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    
                    return (
                      <React.Fragment key={step}>
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                          isComplete ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400",
                          isCurrent && "ring-2 ring-blue-200"
                        )}>
                          {i + 1}
                        </div>
                        {i < 4 && (
                          <div className={cn(
                            "flex-1 h-1 rounded",
                            i < currentIndex ? "bg-blue-600" : "bg-slate-200"
                          )} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Pending</span>
                  <span>Composing</span>
                  <span>Printing</span>
                  <span>Shipped</span>
                  <span>Delivered</span>
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Order Information</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Campaign</span>
                    <span className="font-medium">{campaignLookup[selectedOrder.campaign_id]?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Postcard Size</span>
                    <span className="font-medium">{selectedOrder.postcard_size || '4x6'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Pieces</span>
                    <span className="font-medium">{selectedOrder.total_pieces?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Credits Used</span>
                    <span className="font-medium">{selectedOrder.total_credits_used?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created</span>
                    <span className="font-medium">
                      {format(new Date(selectedOrder.created_date), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking */}
              {selectedOrder.tracking_imb?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Tracking</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Intelligent Mail Barcodes</p>
                    <div className="space-y-1">
                      {selectedOrder.tracking_imb.slice(0, 5).map((imb, i) => (
                        <code key={i} className="block text-xs text-slate-700 font-mono">{imb}</code>
                      ))}
                      {selectedOrder.tracking_imb.length > 5 && (
                        <p className="text-xs text-slate-500">
                          +{selectedOrder.tracking_imb.length - 5} more...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error info */}
              {selectedOrder.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{selectedOrder.error_message}</p>
                  {selectedOrder.error_code && (
                    <p className="text-xs text-red-500 mt-1">Code: {selectedOrder.error_code}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}