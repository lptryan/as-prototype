import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Type,
  Image,
  Square,
  Circle,
  Sparkles,
  Undo2,
  Redo2,
  Save,
  Download,
  Eye,
  Trash2,
  Copy,
  Layers,
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Upload,
  Wand2,
  Loader2,
  Tag,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TemplateSelector from '@/components/design/TemplateSelector';
import LayersPanel from '@/components/design/LayersPanel';

// Canvas dimensions for different postcard sizes
const CANVAS_SIZES = {
  '4x6': { width: 600, height: 400, label: '4" × 6"' },
  '6x9': { width: 900, height: 600, label: '6" × 9"' },
  '6x11': { width: 1100, height: 600, label: '6" × 11"' },
};

// Merge tags for personalization
const MERGE_TAGS = [
  { tag: '{{FirstName}}', label: 'First Name' },
  { tag: '{{LastName}}', label: 'Last Name' },
  { tag: '{{Address}}', label: 'Street Address' },
  { tag: '{{City}}', label: 'City' },
  { tag: '{{State}}', label: 'State' },
  { tag: '{{ZipCode}}', label: 'Zip Code' },
];

export default function DesignStudio() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  
  const campaignId = searchParams.get('campaignId');
  
  const [postcardSize, setPostcardSize] = useState('4x6');
  const [selectedElement, setSelectedElement] = useState(null);
  const [elements, setElements] = useState([]);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showMagicWriteDialog, setShowMagicWriteDialog] = useState(false);
  const [magicWritePrompt, setMagicWritePrompt] = useState('');
  const [magicWriteResults, setMagicWriteResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [customFonts, setCustomFonts] = useState([]);

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (data) => data?.[0],
  });

  // Load existing design if campaign exists
  useEffect(() => {
    if (campaign?.design_data?.elements) {
      setElements(campaign.design_data.elements);
      setPostcardSize(campaign.postcard_size || '4x6');
    } else if (!campaignId && elements.length === 0) {
      // Show templates for new campaigns
      setShowTemplates(true);
    }
  }, [campaign, campaignId, elements.length]);

  const handleSelectTemplate = (template) => {
    setElements(template.design_data.elements || []);
    setPostcardSize(template.size);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" loaded`);
  };

  const handleStartBlank = () => {
    setShowTemplates(false);
  };

  const addElement = (type) => {
    const canvasSize = CANVAS_SIZES[postcardSize];
    const newElement = {
      id: Date.now().toString(),
      type,
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 25,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 40 : 100,
      opacity: 1,
      hidden: false,
      locked: false,
      ...(type === 'text' && {
        content: 'Double-click to edit',
        fontSize: 24,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        color: '#1E293B',
      }),
      ...(type === 'rectangle' && {
        fill: '#3B82F6',
        fillType: 'solid',
        gradientStart: '#3B82F6',
        gradientEnd: '#1E40AF',
        gradientDirection: 'to bottom',
        stroke: '',
        strokeWidth: 0,
        borderRadius: 8,
      }),
      ...(type === 'circle' && {
        fill: '#10B981',
        fillType: 'solid',
        gradientStart: '#10B981',
        gradientEnd: '#059669',
        gradientDirection: 'to bottom',
        stroke: '',
        strokeWidth: 0,
      }),
      ...(type === 'image' && {
        src: '',
        objectFit: 'cover',
        brightness: 100,
        contrast: 100,
        saturate: 100,
        blur: 0,
      }),
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const addMergeTag = (tag) => {
    const canvasSize = CANVAS_SIZES[postcardSize];
    const newElement = {
      id: Date.now().toString(),
      type: 'merge_tag',
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 15,
      width: 150,
      height: 30,
      tag: tag.tag,
      label: tag.label,
      fontSize: 18,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      color: '#7C3AED',
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const duplicateElement = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: Date.now().toString(),
        x: element.x + 20,
        y: element.y + 20,
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
    }
  };

  const toggleVisibility = (id) => {
    setElements(elements.map(el => el.id === id ? { ...el, hidden: !el.hidden } : el));
  };

  const toggleLock = (id) => {
    setElements(elements.map(el => el.id === id ? { ...el, locked: !el.locked } : el));
  };

  const handleUploadFont = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const fontName = file.name.replace(/\.[^/.]+$/, "");
      
      // Create @font-face rule
      const fontFace = new FontFace(fontName, `url(${file_url})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      
      setCustomFonts([...customFonts, fontName]);
      toast.success(`Font "${fontName}" uploaded`);
    } catch (error) {
      toast.error('Failed to upload font');
    }
  };

  // Magic Write AI integration
  const handleMagicWrite = async () => {
    if (!magicWritePrompt.trim()) {
      toast.error('Please describe what you\'re promoting');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a real estate marketing copywriter. Generate 3 punchy, attention-grabbing headlines for a direct mail postcard.

Context: ${magicWritePrompt}

Requirements:
- Each headline should be under 10 words
- Use action words and create urgency
- Be professional but engaging
- Avoid clichés

Return as JSON array with format: { "headlines": ["headline1", "headline2", "headline3"] }`,
        response_json_schema: {
          type: 'object',
          properties: {
            headlines: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });
      
      setMagicWriteResults(result.headlines || []);
    } catch (error) {
      toast.error('Failed to generate headlines');
    } finally {
      setIsGenerating(false);
    }
  };

  const insertHeadline = (headline) => {
    const canvasSize = CANVAS_SIZES[postcardSize];
    const newElement = {
      id: Date.now().toString(),
      type: 'text',
      x: canvasSize.width / 2 - 150,
      y: 50,
      width: 300,
      height: 50,
      content: headline,
      fontSize: 32,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1E293B',
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setShowMagicWriteDialog(false);
    setMagicWriteResults([]);
    setMagicWritePrompt('');
    toast.success('Headline added to canvas');
  };

  // Save design
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!campaignId) {
        // Create new campaign
        return base44.entities.Campaign.create({
          name: 'Untitled Campaign',
          status: 'designing',
          postcard_size: postcardSize,
          design_data: { elements },
          merge_tags: elements.filter(e => e.type === 'merge_tag').map(e => ({
            tag: e.tag,
            x: e.x,
            y: e.y,
            font: e.fontFamily,
            fontSize: e.fontSize,
          })),
        });
      }
      
      return base44.entities.Campaign.update(campaignId, {
        postcard_size: postcardSize,
        design_data: { elements },
        merge_tags: elements.filter(e => e.type === 'merge_tag').map(e => ({
          tag: e.tag,
          x: e.x,
          y: e.y,
          font: e.fontFamily,
          fontSize: e.fontSize,
        })),
        status: 'designing',
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['campaign'] });
      toast.success('Design saved');
      if (!campaignId && result?.id) {
        navigate(createPageUrl('DesignStudio') + `?campaignId=${result.id}`, { replace: true });
      }
    },
  });

  const selectedEl = elements.find(el => el.id === selectedElement);
  const canvasSize = CANVAS_SIZES[postcardSize];

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Template Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Start with a professional design or blank canvas
            </DialogDescription>
          </DialogHeader>
          <TemplateSelector 
            onSelectTemplate={handleSelectTemplate}
            selectedSize={postcardSize}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleStartBlank}>
              Start with Blank Canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Campaigns'))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <span className="font-semibold text-slate-900">
            {campaign?.name || 'New Design'}
          </span>
          <Select value={postcardSize} onValueChange={setPostcardSize}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CANVAS_SIZES).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowTemplates(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(50, zoom - 10))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={showGrid ? 'bg-slate-100' : ''}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => addElement('text')}
            title="Add Text"
          >
            <Type className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => addElement('image')}
            title="Add Image"
          >
            <Image className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => addElement('rectangle')}
            title="Add Rectangle"
          >
            <Square className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => addElement('circle')}
            title="Add Circle"
          >
            <Circle className="h-5 w-5" />
          </Button>
          <div className="h-px w-8 bg-slate-200 my-2" />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-purple-600"
            onClick={() => setShowMagicWriteDialog(true)}
            title="Magic Write (AI)"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: canvasSize.width * (zoom / 100),
              height: canvasSize.height * (zoom / 100),
              transform: `scale(1)`,
            }}
          >
            {/* Bleed line */}
            <div
              className="absolute inset-3 border-2 border-dashed border-red-300 pointer-events-none z-50"
              style={{ borderRadius: 4 }}
            />
            
            {/* Grid overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-40"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            )}

            {/* Elements */}
            {elements.map((element) => {
              if (element.hidden) return null;
              
              return (
                <div
                  key={element.id}
                  className={cn(
                    "absolute select-none",
                    !element.locked && "cursor-move",
                    selectedElement === element.id && "ring-2 ring-blue-500"
                  )}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    opacity: element.opacity,
                    zIndex: elements.indexOf(element),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                  }}
                  onMouseDown={(e) => {
                    if (element.locked) return;
                    e.preventDefault();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLeft = element.x;
                    const startTop = element.y;
                    
                    const handleMouseMove = (e) => {
                      const deltaX = (e.clientX - startX) / (zoom / 100);
                      const deltaY = (e.clientY - startY) / (zoom / 100);
                      updateElement(element.id, {
                        x: Math.max(0, Math.min(canvasSize.width - element.width, startLeft + deltaX)),
                        y: Math.max(0, Math.min(canvasSize.height - element.height, startTop + deltaY)),
                      });
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                {element.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center pointer-events-none"
                    style={{
                      fontSize: element.fontSize,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textAlign: element.textAlign,
                      color: element.color,
                    }}
                  >
                    {element.content}
                  </div>
                )}
                {element.type === 'merge_tag' && (
                  <div
                    className="w-full h-full flex items-center px-2 bg-purple-100 rounded border-2 border-dashed border-purple-400 pointer-events-none"
                    style={{
                      fontSize: element.fontSize,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      color: element.color,
                    }}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {element.tag}
                  </div>
                )}
                {element.type === 'rectangle' && (
                  <div
                    className="w-full h-full pointer-events-none"
                    style={{
                      background: element.fillType === 'gradient' 
                        ? `linear-gradient(${element.gradientDirection}, ${element.gradientStart}, ${element.gradientEnd})`
                        : element.fill,
                      borderRadius: element.borderRadius || 0,
                      border: element.stroke ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
                    }}
                  />
                )}
                {element.type === 'circle' && (
                  <div
                    className="w-full h-full rounded-full pointer-events-none"
                    style={{
                      background: element.fillType === 'gradient' 
                        ? `linear-gradient(${element.gradientDirection}, ${element.gradientStart}, ${element.gradientEnd})`
                        : element.fill,
                      border: element.stroke ? `${element.strokeWidth}px solid ${element.stroke}` : 'none',
                    }}
                  />
                )}
                {element.type === 'image' && (
                  element.src ? (
                    <img
                      src={element.src}
                      alt=""
                      className="w-full h-full pointer-events-none"
                      style={{ 
                        objectFit: element.objectFit,
                        filter: `brightness(${element.brightness || 100}%) contrast(${element.contrast || 100}%) saturate(${element.saturate || 100}%) blur(${element.blur || 0}px)`
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center pointer-events-none">
                      <Upload className="h-6 w-6 text-slate-400" />
                    </div>
                  )
                )}
              </div>
            );
            })}

            {/* Empty state */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Palette className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">Click a tool to start designing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 bg-white border-l border-slate-200 overflow-y-auto">
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="personalize">Personalize</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="p-4 space-y-4">
              {selectedEl ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 capitalize">{selectedEl.type.replace('_', ' ')}</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateElement(selectedEl.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteElement(selectedEl.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-3">
                   <div>
                     <Label className="text-xs">X Position</Label>
                     <Input
                       type="number"
                       value={selectedEl.x}
                       onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) })}
                     />
                   </div>
                   <div>
                     <Label className="text-xs">Y Position</Label>
                     <Input
                       type="number"
                       value={selectedEl.y}
                       onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) })}
                     />
                   </div>
                   <div>
                     <Label className="text-xs">Width</Label>
                     <Input
                       type="number"
                       value={selectedEl.width}
                       onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) })}
                     />
                   </div>
                   <div>
                     <Label className="text-xs">Height</Label>
                     <Input
                       type="number"
                       value={selectedEl.height}
                       onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) })}
                     />
                   </div>
                  </div>

                  {/* Opacity */}
                  <div>
                   <Label className="text-xs">Opacity</Label>
                   <Slider
                     value={[selectedEl.opacity * 100]}
                     onValueChange={([val]) => updateElement(selectedEl.id, { opacity: val / 100 })}
                     min={0}
                     max={100}
                     step={1}
                   />
                   <span className="text-xs text-slate-500">{Math.round(selectedEl.opacity * 100)}%</span>
                  </div>

                  {/* Text properties */}
                  {(selectedEl.type === 'text' || selectedEl.type === 'merge_tag') && (
                    <>
                      {selectedEl.type === 'text' && (
                        <div>
                          <Label className="text-xs">Content</Label>
                          <Textarea
                            value={selectedEl.content}
                            onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                            rows={3}
                          />
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Font Family</Label>
                        <Select value={selectedEl.fontFamily} onValueChange={(val) => updateElement(selectedEl.id, { fontFamily: val })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            {customFonts.map(font => (
                              <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            onChange={handleUploadFont}
                            className="hidden"
                            id="font-upload"
                          />
                          <Button variant="outline" size="sm" className="w-full" onClick={() => document.getElementById('font-upload').click()}>
                            <Upload className="h-3 w-3 mr-2" />
                            Upload Custom Font
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Font Size</Label>
                        <Slider
                          value={[selectedEl.fontSize]}
                          onValueChange={([val]) => updateElement(selectedEl.id, { fontSize: val })}
                          min={8}
                          max={120}
                          step={1}
                        />
                        <span className="text-xs text-slate-500">{selectedEl.fontSize}px</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant={selectedEl.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedEl.fontStyle === 'italic' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateElement(selectedEl.id, { fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <div className="h-8 w-px bg-slate-200 mx-1" />
                        <Button
                          variant={selectedEl.textAlign === 'left' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateElement(selectedEl.id, { textAlign: 'left' })}
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedEl.textAlign === 'center' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateElement(selectedEl.id, { textAlign: 'center' })}
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={selectedEl.textAlign === 'right' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateElement(selectedEl.id, { textAlign: 'right' })}
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <Input
                          type="color"
                          value={selectedEl.color}
                          onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                          className="h-10 p-1"
                        />
                      </div>
                    </>
                  )}

                  {/* Shape properties */}
                  {(selectedEl.type === 'rectangle' || selectedEl.type === 'circle') && (
                    <>
                      <div>
                        <Label className="text-xs">Fill Type</Label>
                        <Select value={selectedEl.fillType || 'solid'} onValueChange={(val) => updateElement(selectedEl.id, { fillType: val })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solid Color</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedEl.fillType === 'gradient' ? (
                        <>
                          <div>
                            <Label className="text-xs">Gradient Start</Label>
                            <Input
                              type="color"
                              value={selectedEl.gradientStart || selectedEl.fill}
                              onChange={(e) => updateElement(selectedEl.id, { gradientStart: e.target.value })}
                              className="h-10 p-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Gradient End</Label>
                            <Input
                              type="color"
                              value={selectedEl.gradientEnd || selectedEl.fill}
                              onChange={(e) => updateElement(selectedEl.id, { gradientEnd: e.target.value })}
                              className="h-10 p-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Direction</Label>
                            <Select value={selectedEl.gradientDirection || 'to bottom'} onValueChange={(val) => updateElement(selectedEl.id, { gradientDirection: val })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="to bottom">Top to Bottom</SelectItem>
                                <SelectItem value="to top">Bottom to Top</SelectItem>
                                <SelectItem value="to right">Left to Right</SelectItem>
                                <SelectItem value="to left">Right to Left</SelectItem>
                                <SelectItem value="to bottom right">Diagonal ↘</SelectItem>
                                <SelectItem value="to bottom left">Diagonal ↙</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <div>
                          <Label className="text-xs">Fill Color</Label>
                          <Input
                            type="color"
                            value={selectedEl.fill}
                            onChange={(e) => updateElement(selectedEl.id, { fill: e.target.value })}
                            className="h-10 p-1"
                          />
                        </div>
                      )}

                      {selectedEl.type === 'rectangle' && (
                        <div>
                          <Label className="text-xs">Border Radius</Label>
                          <Slider
                            value={[selectedEl.borderRadius]}
                            onValueChange={([val]) => updateElement(selectedEl.id, { borderRadius: val })}
                            min={0}
                            max={50}
                            step={1}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Image properties */}
                  {selectedEl.type === 'image' && (
                    <>
                      <div>
                        <Label className="text-xs">Image URL</Label>
                        <Input
                          value={selectedEl.src}
                          onChange={(e) => updateElement(selectedEl.id, { src: e.target.value })}
                          placeholder="Paste image URL or upload"
                        />
                        <Button variant="outline" className="w-full mt-2" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>

                      {selectedEl.src && (
                        <>
                          <div>
                            <Label className="text-xs">Brightness</Label>
                            <Slider
                              value={[selectedEl.brightness || 100]}
                              onValueChange={([val]) => updateElement(selectedEl.id, { brightness: val })}
                              min={0}
                              max={200}
                              step={1}
                            />
                            <span className="text-xs text-slate-500">{selectedEl.brightness || 100}%</span>
                          </div>

                          <div>
                            <Label className="text-xs">Contrast</Label>
                            <Slider
                              value={[selectedEl.contrast || 100]}
                              onValueChange={([val]) => updateElement(selectedEl.id, { contrast: val })}
                              min={0}
                              max={200}
                              step={1}
                            />
                            <span className="text-xs text-slate-500">{selectedEl.contrast || 100}%</span>
                          </div>

                          <div>
                            <Label className="text-xs">Saturation</Label>
                            <Slider
                              value={[selectedEl.saturate || 100]}
                              onValueChange={([val]) => updateElement(selectedEl.id, { saturate: val })}
                              min={0}
                              max={200}
                              step={1}
                            />
                            <span className="text-xs text-slate-500">{selectedEl.saturate || 100}%</span>
                          </div>

                          <div>
                            <Label className="text-xs">Blur</Label>
                            <Slider
                              value={[selectedEl.blur || 0]}
                              onValueChange={([val]) => updateElement(selectedEl.id, { blur: val })}
                              min={0}
                              max={20}
                              step={1}
                            />
                            <span className="text-xs text-slate-500">{selectedEl.blur || 0}px</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select an element to edit its properties</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="personalize" className="p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Add merge tags to personalize each postcard with recipient data.
              </p>
              <div className="space-y-2">
                {MERGE_TAGS.map((tag) => (
                  <Button
                    key={tag.tag}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addMergeTag(tag)}
                  >
                    <Tag className="h-4 w-4 mr-2 text-purple-600" />
                    {tag.label}
                    <span className="ml-auto text-xs text-slate-400">{tag.tag}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layers" className="p-0 h-[calc(100vh-8rem)]">
              <LayersPanel
                elements={elements}
                selectedElement={selectedElement}
                onReorder={setElements}
                onSelect={setSelectedElement}
                onToggleVisibility={toggleVisibility}
                onToggleLock={toggleLock}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Magic Write Dialog */}
      <Dialog open={showMagicWriteDialog} onOpenChange={setShowMagicWriteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Magic Write
            </DialogTitle>
            <DialogDescription>
              Let AI generate compelling headlines for your postcard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>What are you promoting?</Label>
              <Textarea
                placeholder="e.g., Just sold a home in Jacksonville Beach for $50K over asking price"
                value={magicWritePrompt}
                onChange={(e) => setMagicWritePrompt(e.target.value)}
                rows={3}
              />
            </div>
            
            {magicWriteResults.length > 0 && (
              <div className="space-y-2">
                <Label>Choose a headline:</Label>
                {magicWriteResults.map((headline, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => insertHeadline(headline)}
                  >
                    <span className="line-clamp-2">{headline}</span>
                    <ArrowRight className="h-4 w-4 ml-auto flex-shrink-0" />
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMagicWriteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMagicWrite} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate Headlines
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}