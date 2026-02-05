import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatsCard from '@/components/common/StatsCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
  Users,
  Send,
  DollarSign,
  TrendingUp,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// Sample data for charts
const revenueData = [
  { month: 'Jan', revenue: 12400, orders: 145 },
  { month: 'Feb', revenue: 15600, orders: 178 },
  { month: 'Mar', revenue: 18200, orders: 203 },
  { month: 'Apr', revenue: 21400, orders: 234 },
  { month: 'May', revenue: 19800, orders: 219 },
  { month: 'Jun', revenue: 24600, orders: 267 },
];

export default function AdminDashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => base44.entities.SystemLog.filter({ level: 'error' }, '-created_date', 10),
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.credit_balance > 0).length,
    totalCampaigns: campaigns.length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => ['pending', 'composing', 'printing'].includes(o.status)).length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total_credits_used || 0) * 0.50, 0),
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
          change={`${stats.activeUsers} active`}
        />
        <StatsCard
          title="Campaigns"
          value={stats.totalCampaigns.toLocaleString()}
          icon={Send}
          iconColor="bg-purple-100 text-purple-600"
          change="+12% this month"
          changeType="positive"
        />
        <StatsCard
          title="Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={Truck}
          iconColor="bg-emerald-100 text-emerald-600"
          change={`${stats.pendingOrders} pending`}
        />
        <StatsCard
          title="Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          iconColor="bg-amber-100 text-amber-600"
          change="+8.2%"
          changeType="positive"
          subtitle="vs last month"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    formatter={(value) => [value.toLocaleString(), 'Orders']}
                  />
                  <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Order ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pieces</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    #{order.id?.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {order.user_email}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>{order.total_pieces?.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-500">
                    {format(new Date(order.created_date), 'MMM d')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-900">API Services</span>
              </div>
              <span className="text-sm text-emerald-600">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-900">Print Queue</span>
              </div>
              <span className="text-sm text-emerald-600">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">AccuZip API</span>
              </div>
              <span className="text-sm text-yellow-600">Degraded</span>
            </div>

            {/* Recent Errors */}
            {logs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Errors</h4>
                <div className="space-y-2">
                  {logs.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-700 line-clamp-1">{log.message}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(log.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}