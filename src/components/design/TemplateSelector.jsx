import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { postcardTemplates, templateCategories } from './PostcardTemplates';
import { Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TemplateSelector({ onSelectTemplate, selectedSize = '4x6' }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  const filteredTemplates = postcardTemplates.filter(template => {
    const categoryMatch = selectedCategory === 'All' || template.category === selectedCategory;
    const sizeMatch = !selectedSize || template.size === selectedSize;
    return categoryMatch && sizeMatch;
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Choose a Template</h2>
        </div>
        <p className="text-slate-600">Start with a professionally designed postcard</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {templateCategories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
              hoveredId === template.id && "ring-2 ring-blue-500"
            )}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectTemplate(template)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-semibold text-sm">{template.name}</p>
                  <p className="text-white/80 text-xs">{template.size}</p>
                </div>
                {hoveredId === template.id && (
                  <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                    <Button className="bg-white text-blue-600 hover:bg-blue-50">
                      <Check className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p>No templates found for this category and size.</p>
        </div>
      )}
    </div>
  );
}