import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useBranding } from '@/components/ui/BrandingProvider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Map,
  Palette,
  CreditCard,
  Settings,
  Users,
  FileText,
  Mail,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  BarChart3,
  Layers,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard', roles: ['user', 'admin'] },
  { name: 'Farm Map', icon: Map, page: 'FarmMap', roles: ['user', 'admin'] },
  { name: 'Campaigns', icon: Send, page: 'Campaigns', roles: ['user', 'admin'] },
  { name: 'Design Studio', icon: Palette, page: 'DesignStudio', roles: ['user', 'admin'] },
  { name: 'Orders', icon: FileText, page: 'Orders', roles: ['user', 'admin'] },
  { name: 'Credits', icon: CreditCard, page: 'Credits', roles: ['user', 'admin'] },
];

const adminItems = [
  { name: 'Admin Dashboard', icon: Shield, page: 'AdminDashboard', roles: ['admin'] },
  { name: 'Users', icon: Users, page: 'AdminUsers', roles: ['admin'] },
  { name: 'All Orders', icon: Layers, page: 'AdminOrders', roles: ['admin'] },
  { name: 'Analytics', icon: BarChart3, page: 'AdminAnalytics', roles: ['admin'] },
  { name: 'Email Studio', icon: Mail, page: 'AdminEmailStudio', roles: ['admin'] },
  { name: 'Branding', icon: Palette, page: 'AdminBranding', roles: ['admin'] },
  { name: 'Settings', icon: Settings, page: 'AdminSettings', roles: ['admin'] },
];

export default function Sidebar({ user, currentPage, collapsed, setCollapsed }) {
  const { branding } = useBranding();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="h-8 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Mail className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-semibold text-slate-900">{branding.app_name}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.page}>
              <Link
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  currentPage === item.page
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", currentPage === item.page && "text-blue-600")} />
                {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <div className={cn("mt-6 mb-2", collapsed ? "px-3" : "px-3")}>
              {!collapsed && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</span>}
              {collapsed && <div className="h-px bg-slate-200" />}
            </div>
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <li key={item.page}>
                  <Link
                    to={createPageUrl(item.page)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      currentPage === item.page
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", currentPage === item.page && "text-indigo-600")} />
                    {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-slate-100">
        <div className={cn("flex items-center gap-3 p-2 rounded-lg", collapsed && "justify-center")}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn("w-full mt-1", collapsed ? "px-0 justify-center" : "justify-start")}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}