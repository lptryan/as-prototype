import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatsCard from '@/components/common/StatsCard';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '@/components/common/LoadingSkeleton';
import { 
  Send, 
  Users, 
  CreditCard, 
  TrendingUp,
  ArrowRight,
  Map,
  Plus,
  Clock,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.filter({ created_by: user?.email }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.filter({ user_email: user?.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => ['processing', 'printed', 'shipped'].includes(c.status)).length,
    totalRecipients: campaigns.reduce((sum, c) => sum + (c.valid_recipients || 0), 0),
    credits: user?.credit_balance || 0,
  };

  const recentActivity = [
    ...campaigns.slice(0, 3).map(c => ({
      type: 'campaign',
      title: c.name,
      status: c.status,
      date: c.created_date,
      id: c.id,
    })),
    ...orders.slice(0, 3).map(o => ({
      type: 'order',
      title: `Order #${o.id?.slice(-8)}`,
      status: o.status,
      date: o.created_date,
      id: o.id,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0] || 'Agent'}!</h1>
          <p className="text-blue-100 mb-6 max-w-xl">
            Ready to reach more homeowners? Start a new campaign or continue designing your postcards.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={createPageUrl('FarmMap')}>
              <Button className="bg-white text-blue-700 hover:bg-blue-50">
                <Map className="h-4 w-4 mr-2" />
                Select Farm Area
              </Button>
            </Link>
            <Link to={createPageUrl('Campaigns')}>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View Campaigns
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {campaignsLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Campaigns"
              value={stats.totalCampaigns}
              icon={Send}
              iconColor="bg-blue-100 text-blue-600"
              change={stats.activeCampaigns > 0 ? `${stats.activeCampaigns} active` : 'No active'}
              changeType="neutral"
            />
            <StatsCard
              title="Total Recipients"
              value={stats.totalRecipients.toLocaleString()}
              icon={Users}
              iconColor="bg-purple-100 text-purple-600"
              change="Validated addresses"
              changeType="neutral"
            />
            <StatsCard
              title="Credit Balance"
              value={stats.credits.toLocaleString()}
              icon={CreditCard}
              iconColor="bg-emerald-100 text-emerald-600"
              change={
                <Link to={createPageUrl('Credits')} className="text-emerald-600 hover:underline">
                  Buy more
                </Link>
              }
            />
            <StatsCard
              title="Success Rate"
              value="98.5%"
              icon={TrendingUp}
              iconColor="bg-amber-100 text-amber-600"
              change="+2.3%"
              changeType="positive"
              subtitle="vs last month"
            />
          </>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <Link to={createPageUrl('Campaigns')}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No activity yet"
              description="Start your first campaign to see activity here"
              action={() => window.location.href = createPageUrl('FarmMap')}
              actionLabel="Create Campaign"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((item, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      item.type === 'campaign' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {item.type === 'campaign' ? (
                        <Send className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Truck className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(item.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to={createPageUrl('FarmMap')} className="block">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Map className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Select Farm Area</p>
                    <p className="text-sm text-slate-500">Choose your target neighborhood</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link to={createPageUrl('DesignStudio')} className="block">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Plus className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Design Postcard</p>
                    <p className="text-sm text-slate-500">Create stunning mail pieces</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link to={createPageUrl('Credits')} className="block">
              <div className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Buy Credits</p>
                    <p className="text-sm text-slate-500">Top up your balance</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Campaign Pipeline */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Campaign Pipeline</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-slate-600">In Progress</span>
                </div>
                <span className="font-medium text-slate-900">
                  {campaigns.filter(c => ['draft', 'designing', 'pending_hygiene'].includes(c.status)).length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="text-slate-600">Ready to Send</span>
                </div>
                <span className="font-medium text-slate-900">
                  {campaigns.filter(c => c.status === 'ready').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-500" />
                  <span className="text-slate-600">In Transit</span>
                </div>
                <span className="font-medium text-slate-900">
                  {campaigns.filter(c => c.status === 'shipped').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}