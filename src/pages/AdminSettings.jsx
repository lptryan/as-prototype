import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Key,
  DollarSign,
  Shield,
  Save,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultConfig = {
  pricing: {
    cost_per_4x6: 0.50,
    cost_per_6x9: 0.75,
    cost_per_6x11: 0.95,
    bulk_discount_threshold: 1000,
    bulk_discount_percent: 10,
  },
  limits: {
    max_upload_size_mb: 10,
    max_recipients_per_campaign: 10000,
    free_tier_credits: 50,
  },
  integrations: {
    melissa_api_key: '',
    accuzip_api_key: '',
    fusionpro_endpoint: '',
    fusionpro_api_key: '',
    openai_api_key: '',
    mapbox_token: '',
    stripe_publishable_key: '',
    resend_api_key: '',
  },
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(defaultConfig);
  const [showSecrets, setShowSecrets] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => base44.entities.SystemConfig.filter({ config_key: 'main' }),
  });

  useEffect(() => {
    if (configs?.[0]) {
      setConfig({
        pricing: { ...defaultConfig.pricing, ...configs[0].pricing },
        limits: { ...defaultConfig.limits, ...configs[0].limits },
        integrations: { ...defaultConfig.integrations, ...configs[0].integrations },
      });
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async (configData) => {
      if (configs?.[0]?.id) {
        return base44.entities.SystemConfig.update(configs[0].id, configData);
      } else {
        return base44.entities.SystemConfig.create({ config_key: 'main', ...configData });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('Settings saved');
      setHasChanges(false);
    },
  });

  const updateConfig = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setHasChanges(true);
  };

  const toggleSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const integrationFields = [
    { key: 'melissa_api_key', label: 'Melissa Data API Key', description: 'For address validation and property data' },
    { key: 'accuzip_api_key', label: 'AccuZip API Key', description: 'For CASS/NCOA address hygiene' },
    { key: 'fusionpro_endpoint', label: 'FusionPro Server URL', description: 'Variable data printing endpoint' },
    { key: 'fusionpro_api_key', label: 'FusionPro API Key', description: 'Authentication for print server' },
    { key: 'openai_api_key', label: 'OpenAI API Key', description: 'For Magic Write AI features' },
    { key: 'mapbox_token', label: 'Mapbox Access Token', description: 'For map interface' },
    { key: 'stripe_publishable_key', label: 'Stripe Publishable Key', description: 'For payment processing' },
    { key: 'resend_api_key', label: 'Resend API Key', description: 'For transactional emails' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">System Settings</h2>
          <p className="text-slate-500 mt-1">Configure platform settings and integrations</p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate(config)} 
          disabled={saveMutation.isPending || !hasChanges}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pricing">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="limits">
            <Shield className="h-4 w-4 mr-2" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Postcard Pricing</CardTitle>
              <CardDescription>Set the cost per piece for each postcard size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>4" × 6" (per piece)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.pricing.cost_per_4x6}
                      onChange={(e) => updateConfig('pricing', 'cost_per_4x6', parseFloat(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>6" × 9" (per piece)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.pricing.cost_per_6x9}
                      onChange={(e) => updateConfig('pricing', 'cost_per_6x9', parseFloat(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>6" × 11" (per piece)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.pricing.cost_per_6x11}
                      onChange={(e) => updateConfig('pricing', 'cost_per_6x11', parseFloat(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Bulk Discount Threshold</Label>
                  <Input
                    type="number"
                    value={config.pricing.bulk_discount_threshold}
                    onChange={(e) => updateConfig('pricing', 'bulk_discount_threshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-slate-500">Minimum pieces for bulk discount</p>
                </div>
                <div className="space-y-2">
                  <Label>Bulk Discount Percentage</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={config.pricing.bulk_discount_percent}
                      onChange={(e) => updateConfig('pricing', 'bulk_discount_percent', parseInt(e.target.value))}
                      className="pr-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Limits</CardTitle>
              <CardDescription>Configure upload and usage limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max Upload Size</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={config.limits.max_upload_size_mb}
                      onChange={(e) => updateConfig('limits', 'max_upload_size_mb', parseInt(e.target.value))}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">MB</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Recipients per Campaign</Label>
                  <Input
                    type="number"
                    value={config.limits.max_recipients_per_campaign}
                    onChange={(e) => updateConfig('limits', 'max_recipients_per_campaign', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free Tier Monthly Credits</Label>
                  <Input
                    type="number"
                    value={config.limits.free_tier_credits}
                    onChange={(e) => updateConfig('limits', 'free_tier_credits', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Security Notice</p>
              <p className="text-sm text-amber-700 mt-1">
                API keys are encrypted at rest. Never share these keys or expose them in client-side code.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Vault</CardTitle>
              <CardDescription>Configure third-party service credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrationFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{field.label}</Label>
                    {config.integrations[field.key] && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Configured
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showSecrets[field.key] ? 'text' : 'password'}
                      value={config.integrations[field.key]}
                      onChange={(e) => updateConfig('integrations', field.key, e.target.value)}
                      placeholder="••••••••••••••••"
                      className="pr-10 font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => toggleSecret(field.key)}
                    >
                      {showSecrets[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">{field.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}