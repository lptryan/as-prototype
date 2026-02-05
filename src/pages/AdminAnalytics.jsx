import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatsCard from '@/components/common/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  Users,
  Send,
  DollarSign,
  TrendingUp,
  Mail,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// Sample analytics data
const dailyData = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), 'MMM d'),
  users: Math.floor(Math.random() * 20) + 5,
  campaigns: Math.floor(Math.random() * 30) + 10,
  revenue: Math.floor(Math.random() * 2000) + 500,
  pieces: Math.floor(Math.random() * 10000) + 2000,
}));

const postcardSizeData = [
  { name: '4x6', value: 4500, color: '#3B82F6' },
  { name: '6x9', value: 2800, color: '#10B981' },
  { name: '6x11', value: 1200, color: '#8B5CF6' },
];

const subscriptionData = [
  { name: 'Free', value: 320, color: '#94A3B8' },
  { name: 'Pro', value: 156, color: '#3B82F6' },
  { name: 'Agency', value: 42, color: '#8B5CF6' },
];

const topStates = [
  { state: 'Florida', campaigns: 234, revenue: 12450 },
  { state: 'California', campaigns: 189, revenue: 10230 },
  { state: 'Texas', campaigns: 156, revenue: 8920 },
  { state: 'New York', campaigns: 134, revenue: 7650 },
  { state: 'Arizona', campaigns: 98, revenue: 5430 },
];

export default function AdminAnalytics() {
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_credits_used || 0) * 0.50, 0);
  const totalPieces = orders.reduce((sum, o) => sum + (o.total_pieces || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">Platform Analytics</h2>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={users.length.toLocaleString()}
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
          change="+12.5%"
          changeType="positive"
          subtitle="vs last month"
        />
        <StatsCard
          title="Campaigns Created"
          value={campaigns.length.toLocaleString()}
          icon={Send}
          iconColor="bg-purple-100 text-purple-600"
          change="+8.2%"
          changeType="positive"
          subtitle="vs last month"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          iconColor="bg-emerald-100 text-emerald-600"
          change="+15.3%"
          changeType="positive"
          subtitle="vs last month"
        />
        <StatsCard
          title="Pieces Mailed"
          value={totalPieces.toLocaleString()}
          icon={Mail}
          iconColor="bg-amber-100 text-amber-600"
          change="+22.1%"
          changeType="positive"
          subtitle="vs last month"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Users & Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={false} name="New Users" />
                  <Line type="monotone" dataKey="campaigns" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Campaigns" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Postcard Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={postcardSizeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {postcardSizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {postcardSizeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {subscriptionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStates.map((item, i) => (
                <div key={item.state} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400 w-4">{i + 1}</span>
                    <span className="font-medium text-slate-900">{item.state}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${item.revenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{item.campaigns} campaigns</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pieces Mailed Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Pieces Mailed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  formatter={(value) => [value.toLocaleString(), 'Pieces']}
                />
                <Bar dataKey="pieces" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}