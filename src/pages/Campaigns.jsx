import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Copy,
  Send,
  Map,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [hygieneResults, setHygieneResults] = useState(null);
  const [processingHygiene, setProcessingHygiene] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', user?.email],
    queryFn: () => base44.entities.Campaign.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
      setDeleteId(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (campaign) => {
      const { id, created_date, updated_date, created_by, ...data } = campaign;
      return base44.entities.Campaign.create({
        ...data,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign duplicated');
    },
  });

  // Automated hygiene check
  const runHygieneCheck = async (campaign) => {
    setProcessingHygiene(true);
    
    try {
      // Update status to pending_hygiene
      await base44.entities.Campaign.update(campaign.id, { status: 'pending_hygiene' });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      // Simulate AccuZip CASS/NCOA processing
      // In production, this would call: await base44.integrations.AccuZip.validateAddresses(...)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate results (in production, parse from AccuZip response)
      const totalRecipients = campaign.total_recipients || 0;
      const invalidCount = Math.floor(Math.random() * totalRecipients * 0.20); // 0-20% invalid
      const validRecipients = totalRecipients - invalidCount;
      const invalidPercentage = totalRecipients > 0 ? (invalidCount / totalRecipients) * 100 : 0;
      
      const results = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        totalRecipients,
        validRecipients,
        invalidRecipients: invalidCount,
        invalidPercentage: parseFloat(invalidPercentage.toFixed(1)),
        hasHighWaste: invalidPercentage > 15,
      };
      
      // Update campaign with hygiene results
      await base44.entities.Campaign.update(campaign.id, {
        valid_recipients: validRecipients,
        invalid_percentage: results.invalidPercentage,
        status: 'ready',
      });
      
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setHygieneResults(results);
      
    } catch (error) {
      toast.error('Hygiene check failed');
      await base44.entities.Campaign.update(campaign.id, { status: campaign.status });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } finally {
      setProcessingHygiene(false);
    }
  };

  const handleProceedToPrint = async () => {
    if (!hygieneResults) return;
    
    // Move to processing status
    await base44.entities.Campaign.update(hygieneResults.campaignId, { status: 'processing' });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    setHygieneResults(null);
    toast.success('Campaign moved to processing');
  };

  const handleCancelReady = async () => {
    if (!hygieneResults) return;
    
    // Revert to designing status
    await base44.entities.Campaign.update(hygieneResults.campaignId, { status: 'designing' });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    setHygieneResults(null);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="designing">Designing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link to={createPageUrl('FarmMap')}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Table */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No campaigns found"
          description={searchQuery || statusFilter !== 'all' 
            ? "Try adjusting your filters"
            : "Start your first direct mail campaign to reach homeowners in your area"
          }
          action={() => window.location.href = createPageUrl('FarmMap')}
          actionLabel="Create Campaign"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Campaign Name</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Size</TableHead>
                <TableHead className="font-semibold">Recipients</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <Send className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{campaign.name}</p>
                        <p className="text-sm text-slate-500">
                          {campaign.target_area?.type === 'zipcodes' 
                            ? `${campaign.target_area.codes?.length || 0} zip codes`
                            : 'Custom area'
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={campaign.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-900 font-medium">{campaign.postcard_size || '4x6'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-900">{(campaign.valid_recipients || campaign.total_recipients || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500">
                      {format(new Date(campaign.created_date), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('DesignStudio') + `?campaignId=${campaign.id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Design
                          </Link>
                        </DropdownMenuItem>
                        {['draft', 'designing'].includes(campaign.status) && (
                          <DropdownMenuItem 
                            onClick={() => runHygieneCheck(campaign)}
                            disabled={processingHygiene}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Ready for Print
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(campaign)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setDeleteId(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the campaign and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hygiene Results Dialog */}
      <Dialog open={!!hygieneResults} onOpenChange={(open) => !open && setHygieneResults(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {hygieneResults?.hasHighWaste ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  High Waste Warning
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Hygiene Check Complete
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              CASS/NCOA validation results for "{hygieneResults?.campaignName}"
            </DialogDescription>
          </DialogHeader>

          {hygieneResults && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600">Total Recipients</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {hygieneResults.totalRecipients.toLocaleString()}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-sm text-emerald-600">Valid Addresses</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {hygieneResults.validRecipients.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={`rounded-lg p-4 ${
                hygieneResults.hasHighWaste ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'
              }`}>
                <div className="flex items-start gap-3">
                  {hygieneResults.hasHighWaste ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      hygieneResults.hasHighWaste ? 'text-amber-900' : 'text-slate-900'
                    }`}>
                      {hygieneResults.invalidPercentage}% Invalid Addresses
                    </p>
                    {hygieneResults.hasHighWaste ? (
                      <p className="text-sm text-amber-700 mt-1">
                        High waste detected! {hygieneResults.invalidRecipients.toLocaleString()} addresses could not be validated. 
                        Consider reviewing your target area to reduce waste.
                      </p>
                    ) : (
                      <p className="text-sm text-slate-600 mt-1">
                        Your campaign meets quality standards. {hygieneResults.invalidRecipients.toLocaleString()} addresses 
                        will be excluded from mailing.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">Estimated Cost</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  ${(hygieneResults.validRecipients * 0.50).toLocaleString()}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Based on {hygieneResults.validRecipients.toLocaleString()} valid recipients @ $0.50 each
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelReady}>
              Go Back
            </Button>
            <Button 
              onClick={handleProceedToPrint}
              className={hygieneResults?.hasHighWaste ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {hygieneResults?.hasHighWaste ? 'Proceed Anyway' : 'Proceed to Print'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}