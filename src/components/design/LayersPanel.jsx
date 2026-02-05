import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock, Unlock, Grip } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LayersPanel({ elements, selectedElement, onReorder, onSelect, onToggleVisibility, onToggleLock }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(elements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReorder(items);
  };

  const getElementLabel = (element) => {
    if (element.type === 'text') return element.content?.substring(0, 20) || 'Text';
    if (element.type === 'merge_tag') return element.tag;
    if (element.type === 'image') return 'Image';
    return element.type.charAt(0).toUpperCase() + element.type.slice(1);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-200">
        <h3 className="font-semibold text-sm text-slate-900">Layers</h3>
        <p className="text-xs text-slate-500 mt-1">Drag to reorder</p>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="layers">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex-1 overflow-y-auto p-2 space-y-1"
            >
              {[...elements].reverse().map((element, index) => {
                const reversedIndex = elements.length - 1 - index;
                return (
                  <Draggable key={element.id} draggableId={element.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-lg border transition-colors cursor-pointer",
                          selectedElement === element.id
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-slate-200 hover:bg-slate-50",
                          snapshot.isDragging && "shadow-lg",
                          element.hidden && "opacity-50"
                        )}
                        onClick={() => onSelect(element.id)}
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                          <Grip className="h-4 w-4 text-slate-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {getElementLabel(element)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {element.type === 'text' || element.type === 'merge_tag' ? 'Text' : element.type}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(element.id);
                          }}
                        >
                          {element.hidden ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock(element.id);
                          }}
                        >
                          {element.locked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}