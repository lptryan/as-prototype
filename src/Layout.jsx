import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BrandingProvider } from '@/components/ui/BrandingProvider';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/navigation/TopBar';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const pageTitles = {
  Dashboard: { title: 'Dashboard', subtitle: 'Overview of your direct mail campaigns' },
  FarmMap: { title: 'Farm Map', subtitle: 'Select your target geographic area' },
  Campaigns: { title: 'Campaigns', subtitle: 'Manage your mail campaigns' },
  DesignStudio: { title: 'Design Studio', subtitle: 'Create stunning postcards' },
  Orders: { title: 'Orders', subtitle: 'Track your order history' },
  Credits: { title: 'Credits', subtitle: 'Manage your credit balance' },
  AdminDashboard: { title: 'Admin Dashboard', subtitle: 'System overview and analytics' },
  AdminUsers: { title: 'User Management', subtitle: 'Manage platform users' },
  AdminOrders: { title: 'All Orders', subtitle: 'Monitor all platform orders' },
  AdminAnalytics: { title: 'Analytics', subtitle: 'Platform performance metrics' },
  AdminEmailStudio: { title: 'Email Studio', subtitle: 'Configure system emails' },
  AdminBranding: { title: 'Branding', subtitle: 'Customize platform appearance' },
  AdminSettings: { title: 'Settings', subtitle: 'System configuration' },
};

// Pages that don't use the standard layout
const fullWidthPages = ['DesignStudio'];

export default function Layout({ children, currentPageName }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        // If auth fails (e.g., app is public), return null
        return null;
      }
    },
    retry: false,
  });

  const pageInfo = pageTitles[currentPageName] || { title: currentPageName, subtitle: '' };
  const isFullWidth = fullWidthPages.includes(currentPageName);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }



  return (
    <BrandingProvider>
      <style>{`
        :root {
          --brand-primary: #0F172A;
          --brand-secondary: #3B82F6;
          --brand-accent: #10B981;
          --brand-background: #F8FAFC;
          --brand-text: #1E293B;
          --brand-radius: 12px;
          --brand-blur: 10px;
        }
      `}</style>
      
      <div className="min-h-screen bg-slate-50">
        <Sidebar
          user={user}
          currentPage={currentPageName}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        
        <div className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          {!isFullWidth && (
            <TopBar user={user} title={pageInfo.title} subtitle={pageInfo.subtitle} />
          )}
          
          <main className={cn(
            isFullWidth ? "h-screen" : "p-6"
          )}>
            {children}
          </main>
        </div>
      </div>
    </BrandingProvider>
  );
}