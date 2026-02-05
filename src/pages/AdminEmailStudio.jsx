import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Mail,
  Send,
  Save,
  Loader2,
  Eye,
  UserPlus,
  Package,
  Truck,
  Key
} from 'lucide-react';
import ReactQuill from 'react-quill';

const emailTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    icon: UserPlus,
    description: 'Sent when a new user registers',
    subject: 'Welcome to {{app_name}}!',
    defaultBody: `<h2>Welcome to {{app_name}}!</h2>
<p>Hi {{user_name}},</p>
<p>Thank you for joining {{app_name}}. We're excited to help you reach more homeowners through direct mail marketing.</p>
<p>Here's what you can do next:</p>
<ul>
  <li>Select your farm area on the map</li>
  <li>Design your first postcard</li>
  <li>Launch your campaign</li>
</ul>
<p>If you have any questions, our support team is here to help.</p>
<p>Best regards,<br>The {{app_name}} Team</p>`,
  },
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    icon: Package,
    description: 'Sent when an order is placed',
    subject: 'Order Confirmed - {{order_id}}',
    defaultBody: `<h2>Your order is confirmed!</h2>
<p>Hi {{user_name}},</p>
<p>We've received your order and it's being processed.</p>
<p><strong>Order Details:</strong></p>
<ul>
  <li>Order ID: {{order_id}}</li>
  <li>Campaign: {{campaign_name}}</li>
  <li>Total Pieces: {{total_pieces}}</li>
  <li>Credits Used: {{credits_used}}</li>
</ul>
<p>We'll send you another email when your postcards are printed and shipped.</p>
<p>Best regards,<br>The {{app_name}} Team</p>`,
  },
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    icon: Truck,
    description: 'Sent when postcards are shipped',
    subject: 'Your postcards are on their way! - {{order_id}}',
    defaultBody: `<h2>Your postcards have shipped!</h2>
<p>Hi {{user_name}},</p>
<p>Great news! Your postcards for campaign "{{campaign_name}}" have been printed and are on their way to your recipients.</p>
<p><strong>Shipment Details:</strong></p>
<ul>
  <li>Order ID: {{order_id}}</li>
  <li>Total Pieces: {{total_pieces}}</li>
  <li>Estimated Delivery: {{estimated_delivery}}</li>
</ul>
<p>Most recipients should receive their postcards within 5-7 business days.</p>
<p>Best regards,<br>The {{app_name}} Team</p>`,
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    icon: Key,
    description: 'Sent for password reset requests',
    subject: 'Reset your {{app_name}} password',
    defaultBody: `<h2>Password Reset Request</h2>
<p>Hi {{user_name}},</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>
<p><a href="{{reset_link}}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link will expire in 24 hours.</p>
<p>Best regards,<br>The {{app_name}} Team</p>`,
  },
];

export default function AdminEmailStudio() {
  const queryClient = useQueryClient();
  const [activeTemplate, setActiveTemplate] = useState('welcome');
  const [templates, setTemplates] = useState({});
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: configs } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => base44.entities.SystemConfig.filter({ config_key: 'main' }),
  });

  useEffect(() => {
    if (configs?.[0]?.email_templates) {
      setTemplates(configs[0].email_templates);
    } else {
      // Initialize with defaults
      const defaults = {};
      emailTemplates.forEach(t => {
        defaults[t.id] = { subject: t.subject, body: t.defaultBody };
      });
      setTemplates(defaults);
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async (emailTemplates) => {
      if (configs?.[0]?.id) {
        return base44.entities.SystemConfig.update(configs[0].id, { email_templates: emailTemplates });
      } else {
        return base44.entities.SystemConfig.create({ config_key: 'main', email_templates: emailTemplates });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('Email templates saved');
    },
  });

  const updateTemplate = (templateId, field, value) => {
    setTemplates(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], [field]: value },
    }));
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsSending(true);
    try {
      const template = templates[activeTemplate] || emailTemplates.find(t => t.id === activeTemplate);
      
      await base44.integrations.Core.SendEmail({
        to: testEmail,
        subject: `[TEST] ${template?.subject || 'Test Email'}`,
        body: template?.body || '<p>Test email content</p>',
      });
      
      toast.success('Test email sent');
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  const currentTemplate = emailTemplates.find(t => t.id === activeTemplate);
  const CurrentIcon = currentTemplate?.icon || Mail;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Email Studio</h2>
          <p className="text-slate-500 mt-1">Customize system email templates</p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate(templates)} 
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Templates
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {emailTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => setActiveTemplate(template.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      activeTemplate === template.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        activeTemplate === template.id ? 'bg-blue-100' : 'bg-slate-100'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          activeTemplate === template.id ? 'text-blue-600' : 'text-slate-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{template.name}</p>
                        <p className="text-xs text-slate-500">{template.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CurrentIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>{currentTemplate?.name}</CardTitle>
                <CardDescription>{currentTemplate?.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={templates[activeTemplate]?.subject || currentTemplate?.subject || ''}
                onChange={(e) => updateTemplate(activeTemplate, 'subject', e.target.value)}
                placeholder="Email subject..."
              />
              <p className="text-xs text-slate-500">
                Available variables: {'{{app_name}}'}, {'{{user_name}}'}, {'{{order_id}}'}, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email Body</Label>
              <ReactQuill
                value={templates[activeTemplate]?.body || currentTemplate?.defaultBody || ''}
                onChange={(value) => updateTemplate(activeTemplate, 'body', value)}
                className="bg-white rounded-lg"
                theme="snow"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ],
                }}
              />
            </div>

            {/* Test Email */}
            <div className="pt-6 border-t border-slate-100">
              <Label className="mb-2 block">Send Test Email</Label>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSendTest} disabled={isSending} variant="outline">
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}