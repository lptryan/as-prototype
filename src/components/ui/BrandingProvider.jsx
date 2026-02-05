import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const defaultBranding = {
  logo_url: '',
  favicon_url: '',
  app_name: 'MailForge',
  primary_color: '#0F172A',
  secondary_color: '#3B82F6',
  accent_color: '#10B981',
  background_color: '#F8FAFC',
  text_color: '#1E293B',
  border_radius: 12,
  glass_blur: 10,
  font_family: 'Inter'
};

const BrandingContext = createContext({ branding: defaultBranding, isLoading: true });

export const useBranding = () => useContext(BrandingContext);

export function BrandingProvider({ children }) {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => base44.entities.SystemConfig.filter({ config_key: 'main' }),
    staleTime: 1000 * 60 * 5,
  });

  const branding = configs?.[0]?.branding || defaultBranding;

  useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', branding.primary_color || defaultBranding.primary_color);
      root.style.setProperty('--brand-secondary', branding.secondary_color || defaultBranding.secondary_color);
      root.style.setProperty('--brand-accent', branding.accent_color || defaultBranding.accent_color);
      root.style.setProperty('--brand-background', branding.background_color || defaultBranding.background_color);
      root.style.setProperty('--brand-text', branding.text_color || defaultBranding.text_color);
      root.style.setProperty('--brand-radius', `${branding.border_radius || defaultBranding.border_radius}px`);
      root.style.setProperty('--brand-blur', `${branding.glass_blur || defaultBranding.glass_blur}px`);
    }
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding: { ...defaultBranding, ...branding }, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export default BrandingProvider;