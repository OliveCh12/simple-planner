'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AddObjectiveItemProps {
  onCreate: (title: string, description: string) => void;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
}

export function AddObjectiveItem({ onCreate, isEditing, onEditingChange }: AddObjectiveItemProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onCreate(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onEditingChange(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    onEditingChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="border border-primary bg-background/60 rounded-md p-3 shadow-sm">
        <div className="space-y-3">
          {/* Title Input */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Title"
            className="text-xs font-medium h-8 border-0"
            autoFocus
          />

          {/* Description Input */}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Description (optional)..."
            rows={2}
            className="text-xs resize-none h-16 border-0 text-muted-foreground"
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="h-7 text-xs"
              >
                Add
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={handleCancel}
                className="h-7 px-3"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Press Enter to add
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer border border-dashed border-muted-foreground/40 bg-background/30 hover:bg-background/50 hover:border-primary/60 rounded-md p-3 transition-all duration-200"
      onClick={() => onEditingChange(true)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Add new objective
          </span>
        </div>
        <div className="text-xs text-muted-foreground/70">
          Click to add
        </div>
      </div>
    </div>
  );
}