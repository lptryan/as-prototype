import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Palette,
  Type,
  Image,
  Layout,
  Save,
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

// WCAG AA contrast checker
function getContrastRatio(color1, color2) {
  const getLuminance = (hexColor) => {
    const rgb = hexColor.replace('#', '').match(/.{2}/g)?.map(x => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }) || [0, 0, 0];
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function meetsWCAGAA(foreground, background) {
  return getContrastRatio(foreground, background) >= 4.5;
}

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
  font_family: 'Inter',
};

export default function AdminBranding() {
  const queryClient = useQueryClient();
  const [branding, setBranding] = useState(defaultBranding);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => base44.entities.SystemConfig.filter({ config_key: 'main' }),
  });

  useEffect(() => {
    if (configs?.[0]?.branding) {
      setBranding({ ...defaultBranding, ...configs[0].branding });
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async (brandingData) => {
      if (configs?.[0]?.id) {
        return base44.entities.SystemConfig.update(configs[0].id, { branding: brandingData });
      } else {
        return base44.entities.SystemConfig.create({ config_key: 'main', branding: brandingData });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('Branding saved');
      setHasChanges(false);
    },
  });

  const updateBranding = (key, value) => {
    setBranding(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setBranding(defaultBranding);
    setHasChanges(true);
  };

  // Contrast warnings
  const textOnBackground = meetsWCAGAA(branding.text_color, branding.background_color);
  const primaryOnWhite = meetsWCAGAA(branding.primary_color, '#FFFFFF');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Brand Customization</h2>
          <p className="text-slate-500 mt-1">Customize the look and feel of your platform</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={() => saveMutation.mutate(branding)} 
            disabled={saveMutation.isPending || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Accessibility Warning */}
      {(!textOnBackground || !primaryOnWhite) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Accessibility Warning</p>
            <p className="text-sm text-amber-700 mt-1">
              Some color combinations don't meet WCAG AA contrast standards. 
              This may make text difficult to read for some users.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Image className="h-4 w-4 mr-2" />
            Logo & Identity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Define your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Primary Color</Label>
                    {!primaryOnWhite && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low contrast
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => updateBranding('primary_color', e.target.value)}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      value={branding.primary_color}
                      onChange={(e) => updateBranding('primary_color', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={branding.secondary_color}
                      onChange={(e) => updateBranding('secondary_color', e.target.value)}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      value={branding.secondary_color}
                      onChange={(e) => updateBranding('secondary_color', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={branding.accent_color}
                      onChange={(e) => updateBranding('accent_color', e.target.value)}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      value={branding.accent_color}
                      onChange={(e) => updateBranding('accent_color', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={branding.background_color}
                      onChange={(e) => updateBranding('background_color', e.target.value)}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      value={branding.background_color}
                      onChange={(e) => updateBranding('background_color', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Text Color</Label>
                    {!textOnBackground && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low contrast
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={branding.text_color}
                      onChange={(e) => updateBranding('text_color', e.target.value)}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      value={branding.text_color}
                      onChange={(e) => updateBranding('text_color', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="border border-slate-200 rounded-xl p-6" style={{ backgroundColor: branding.background_color }}>
                <p className="font-semibold mb-4" style={{ color: branding.text_color }}>
                  Color Preview
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button style={{ backgroundColor: branding.primary_color }}>
                    Primary Button
                  </Button>
                  <Button style={{ backgroundColor: branding.secondary_color }}>
                    Secondary
                  </Button>
                  <Button style={{ backgroundColor: branding.accent_color }}>
                    Accent
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Configure fonts and text styling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <select
                  value={branding.font_family}
                  onChange={(e) => updateBranding('font_family', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="Inter">Inter</option>
                  <option value="system-ui">System UI</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>
              
              <div className="border border-slate-200 rounded-xl p-6" style={{ fontFamily: branding.font_family }}>
                <h3 className="text-2xl font-bold mb-2">Typography Preview</h3>
                <p className="text-slate-600">
                  The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>Adjust spacing and visual effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Border Radius</Label>
                    <span className="text-sm text-slate-500">{branding.border_radius}px</span>
                  </div>
                  <Slider
                    value={[branding.border_radius]}
                    onValueChange={([val]) => updateBranding('border_radius', val)}
                    min={0}
                    max={24}
                    step={2}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Glass Blur Effect</Label>
                    <span className="text-sm text-slate-500">{branding.glass_blur}px</span>
                  </div>
                  <Slider
                    value={[branding.glass_blur]}
                    onValueChange={([val]) => updateBranding('glass_blur', val)}
                    min={0}
                    max={20}
                    step={2}
                  />
                </div>
              </div>

              {/* Layout Preview */}
              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                <p className="text-sm text-slate-500 mb-4">Preview</p>
                <div className="flex gap-4">
                  <div
                    className="h-20 w-32 bg-white shadow-sm border border-slate-200"
                    style={{ borderRadius: branding.border_radius }}
                  />
                  <div
                    className="h-20 w-32 bg-blue-600"
                    style={{ borderRadius: branding.border_radius }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Identity</CardTitle>
              <CardDescription>Upload your brand assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>App Name</Label>
                <Input
                  value={branding.app_name}
                  onChange={(e) => updateBranding('app_name', e.target.value)}
                  placeholder="Your App Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={branding.logo_url}
                  onChange={(e) => updateBranding('logo_url', e.target.value)}
                  placeholder="https://..."
                />
                {branding.logo_url && (
                  <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                    <img src={branding.logo_url} alt="Logo preview" className="h-12 w-auto" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <Input
                  value={branding.favicon_url}
                  onChange={(e) => updateBranding('favicon_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}