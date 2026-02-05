import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatsCard from '@/components/common/StatsCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  CreditCard,
  Coins,
  TrendingUp,
  TrendingDown,
  Zap,
  Crown,
  Building2,
  Check,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CREDIT_PACKS = [
  { id: 'starter', credits: 500, price: 249, perCredit: 0.50, popular: false },
  { id: 'growth', credits: 1000, price: 449, perCredit: 0.45, popular: true },
  { id: 'scale', credits: 2500, price: 999, perCredit: 0.40, popular: false },
  { id: 'enterprise', credits: 5000, price: 1749, perCredit: 0.35, popular: false },
];

const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with direct mail',
    features: [
      '50 free credits/month',
      'Basic templates',
      'Standard support',
      'Up to 500 recipients/campaign',
    ],
    icon: Zap,
    color: 'slate',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    description: 'For growing agents',
    features: [
      '200 credits/month included',
      'Premium templates',
      'Priority support',
      'Up to 2,500 recipients/campaign',
      'Custom branding',
      'Analytics dashboard',
    ],
    icon: Crown,
    color: 'blue',
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 149,
    description: 'For teams and brokerages',
    features: [
      '1,000 credits/month included',
      'All Pro features',
      'White-label options',
      'Unlimited recipients',
      'API access',
      'Dedicated account manager',
      'Team management',
    ],
    icon: Building2,
    color: 'purple',
  },
];

export default function Credits() {
  const queryClient = useQueryClient();
  const [selectedPack, setSelectedPack] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['credit-transactions', user?.email],
    queryFn: () => base44.entities.CreditTransaction.filter({ user_email: user?.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  const handlePurchase = async (pack) => {
    setIsProcessing(true);
    setSelectedPack(pack.id);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`Successfully purchased ${pack.credits} credits!`);
    setIsProcessing(false);
    setSelectedPack(null);
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
  };

  const currentTier = SUBSCRIPTION_TIERS.find(t => t.id === (user?.subscription_tier || 'free'));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Current Balance"
          value={`${(user?.credit_balance || 0).toLocaleString()}`}
          icon={Coins}
          iconColor="bg-emerald-100 text-emerald-600"
          subtitle="credits available"
        />
        <StatsCard
          title="Subscription"
          value={currentTier?.name || 'Free'}
          icon={currentTier?.icon || Zap}
          iconColor={cn(
            currentTier?.id === 'pro' && 'bg-blue-100 text-blue-600',
            currentTier?.id === 'agency' && 'bg-purple-100 text-purple-600',
            currentTier?.id === 'free' && 'bg-slate-100 text-slate-600'
          )}
          subtitle={currentTier?.price ? `$${currentTier.price}/month` : 'No subscription'}
        />
        <StatsCard
          title="This Month"
          value="1,250"
          icon={CreditCard}
          iconColor="bg-blue-100 text-blue-600"
          change="-15%"
          changeType="positive"
          subtitle="credits used"
        />
      </div>

      {/* Buy Credits */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Buy Credit Packs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg",
                pack.popular && "border-blue-500 ring-1 ring-blue-500"
              )}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Best Value
                  </span>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{pack.credits.toLocaleString()}</CardTitle>
                <CardDescription>credits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold text-slate-900">${pack.price}</span>
                  <span className="text-slate-500 ml-1">one-time</span>
                </div>
                <p className="text-sm text-emerald-600 font-medium">
                  ${pack.perCredit.toFixed(2)} per credit
                </p>
                <Button
                  className={cn("w-full", pack.popular && "bg-blue-600 hover:bg-blue-700")}
                  variant={pack.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(pack)}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPack === pack.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const TierIcon = tier.icon;
            const isCurrentTier = tier.id === (user?.subscription_tier || 'free');
            
            return (
              <Card
                key={tier.id}
                className={cn(
                  "relative",
                  tier.popular && "border-blue-500 ring-1 ring-blue-500",
                  isCurrentTier && "bg-slate-50"
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      tier.color === 'blue' && "bg-blue-100",
                      tier.color === 'purple' && "bg-purple-100",
                      tier.color === 'slate' && "bg-slate-100"
                    )}>
                      <TierIcon className={cn(
                        "h-5 w-5",
                        tier.color === 'blue' && "text-blue-600",
                        tier.color === 'purple' && "text-purple-600",
                        tier.color === 'slate' && "text-slate-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-4xl font-bold text-slate-900">
                      ${tier.price}
                    </span>
                    <span className="text-slate-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className={cn(
                          "h-4 w-4 mt-0.5 flex-shrink-0",
                          tier.color === 'blue' && "text-blue-600",
                          tier.color === 'purple' && "text-purple-600",
                          tier.color === 'slate' && "text-slate-600"
                        )} />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrentTier ? "secondary" : tier.popular ? "default" : "outline"}
                    disabled={isCurrentTier}
                  >
                    {isCurrentTier ? 'Current Plan' : 'Upgrade'}
                    {!isCurrentTier && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Transaction History</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No transactions yet
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-slate-500">
                      {format(new Date(tx.created_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.type} size="sm" />
                    </TableCell>
                    <TableCell className="text-slate-900">
                      {tx.description || `${tx.type} transaction`}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      tx.amount > 0 ? "text-emerald-600" : "text-slate-900"
                    )}>
                      {tx.amount > 0 && '+'}{tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {tx.balance_after?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}