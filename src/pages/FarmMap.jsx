import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search,
  MapPin,
  Users,
  Home,
  Loader2,
  ArrowRight,
  Square,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function FarmMap() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedZipCodes, setSelectedZipCodes] = useState([]);
  const [drawMode, setDrawMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leadCount, setLeadCount] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 30.3322, lng: -81.6557 }); // Jacksonville default

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Simulate address count fetch (would use Melissa API in production)
  const fetchAddressCount = async (area) => {
    setIsLoading(true);
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate realistic count based on area size
    const baseCount = Math.floor(Math.random() * 2000) + 500;
    const count = {
      total: baseCount,
      singleFamily: Math.floor(baseCount * 0.7),
      condo: Math.floor(baseCount * 0.15),
      other: Math.floor(baseCount * 0.15),
    };
    
    setLeadCount(count);
    setIsLoading(false);
    return count;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Would integrate with Mapbox Geocoding API
      toast.success(`Searching for "${searchQuery}"...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMapCenter({ lat: 30.3322, lng: -81.6557 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipCodeAdd = (zipCode) => {
    if (zipCode && !selectedZipCodes.includes(zipCode)) {
      const newZipCodes = [...selectedZipCodes, zipCode];
      setSelectedZipCodes(newZipCodes);
      fetchAddressCount({ type: 'zipcodes', codes: newZipCodes });
    }
  };

  const handleZipCodeRemove = (zipCode) => {
    const newZipCodes = selectedZipCodes.filter(z => z !== zipCode);
    setSelectedZipCodes(newZipCodes);
    if (newZipCodes.length > 0) {
      fetchAddressCount({ type: 'zipcodes', codes: newZipCodes });
    } else {
      setLeadCount(null);
    }
  };

  const handlePolygonComplete = (polygon) => {
    setSelectedArea(polygon);
    fetchAddressCount({ type: 'polygon', coordinates: polygon });
  };

  const createCampaignMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Campaign.create(data);
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created! Redirecting to design studio...');
      navigate(createPageUrl('DesignStudio') + `?campaignId=${campaign.id}`);
    },
  });

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    
    createCampaignMutation.mutate({
      name: campaignName,
      status: 'draft',
      target_area: selectedZipCodes.length > 0 
        ? { type: 'zipcodes', codes: selectedZipCodes }
        : { type: 'polygon', coordinates: selectedArea },
      total_recipients: leadCount?.total || 0,
    });
  };

  // Demo zip codes for the area
  const demoZipCodes = ['32224', '32225', '32226', '32227', '32233', '32250', '32266'];

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Map Container */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
        {/* Search Bar Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search address, city, or zip code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white shadow-lg border-0"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </div>

        {/* Map Placeholder - Would be replaced with Mapbox */}
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="h-20 w-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Interactive Map</h3>
            <p className="text-slate-500 mb-6">
              Draw a polygon to select your farm area, or use zip codes from the sidebar.
              The map will display property data and homeowner counts.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant={drawMode ? "default" : "outline"}
                onClick={() => setDrawMode(!drawMode)}
              >
                <Square className="h-4 w-4 mr-2" />
                {drawMode ? 'Drawing Mode Active' : 'Draw Polygon'}
              </Button>
            </div>
          </div>
        </div>

        {/* Map Controls Overlay */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button variant="secondary" size="sm" className="bg-white shadow">
            <MapPin className="h-4 w-4 mr-1" />
            Center Map
          </Button>
          {(selectedArea || selectedZipCodes.length > 0) && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white shadow"
              onClick={() => {
                setSelectedArea(null);
                setSelectedZipCodes([]);
                setLeadCount(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          )}
        </div>

        {/* Lead Count Overlay */}
        {leadCount && (
          <div className="absolute top-20 left-4 bg-white rounded-xl shadow-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-900">
                {leadCount.total.toLocaleString()} Homeowners
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Single Family</span>
                <span className="font-medium">{leadCount.singleFamily.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Condos</span>
                <span className="font-medium">{leadCount.condo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Other</span>
                <span className="font-medium">{leadCount.other.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-96 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Target Area</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="zipcode">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="zipcode">By Zip Code</TabsTrigger>
                <TabsTrigger value="draw">Draw Area</TabsTrigger>
              </TabsList>
              
              <TabsContent value="zipcode" className="space-y-4">
                <div>
                  <Label className="text-sm text-slate-600 mb-2 block">
                    Click zip codes to add them to your farm
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {demoZipCodes.map(zip => (
                      <Badge
                        key={zip}
                        variant={selectedZipCodes.includes(zip) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          if (selectedZipCodes.includes(zip)) {
                            handleZipCodeRemove(zip);
                          } else {
                            handleZipCodeAdd(zip);
                          }
                        }}
                      >
                        {zip}
                        {selectedZipCodes.includes(zip) && (
                          <span className="ml-1">✓</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedZipCodes.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Selected:</span>
                      <span className="font-medium">{selectedZipCodes.length} zip codes</span>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="draw" className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">Drawing Mode</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Click on the map to place points. Connect back to the first point to complete your polygon.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant={drawMode ? "default" : "outline"}
                  onClick={() => {
                    setDrawMode(!drawMode);
                    if (!drawMode) {
                      // Simulate polygon completion after 2 seconds
                      setTimeout(() => {
                        handlePolygonComplete({ lat: mapCenter.lat, lng: mapCenter.lng });
                        setDrawMode(false);
                      }, 2000);
                    }
                  }}
                >
                  <Square className="h-4 w-4 mr-2" />
                  {drawMode ? 'Stop Drawing' : 'Start Drawing'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Summary Card */}
        {leadCount && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-slate-900">
                  {leadCount.total.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">Total Homeowners</div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-slate-600">CASS certified addresses</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-slate-600">NCOA updated</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Est. cost (4x6)</span>
                  <span className="font-semibold text-slate-900">
                    ${(leadCount.total * 0.50).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  $0.50 per piece • Volume discounts available
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCreateDialog(true)}
                disabled={isLoading}
              >
                Continue to Design
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">High Waste Warning</p>
                <p className="text-sm text-amber-700 mt-1">
                  If more than 15% of addresses are invalid after hygiene check, 
                  you'll see a warning before checkout.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Give your campaign a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Jacksonville Beach Spring 2024"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Target Area</span>
                <span className="font-medium">
                  {selectedZipCodes.length > 0 
                    ? `${selectedZipCodes.length} zip codes`
                    : 'Custom polygon'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Homeowners</span>
                <span className="font-medium">{leadCount?.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampaign}
              disabled={createCampaignMutation.isPending}
            >
              {createCampaignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create & Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}