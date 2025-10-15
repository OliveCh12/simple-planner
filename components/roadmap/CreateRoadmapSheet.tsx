'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { saveRoadmap } from '@/lib/db';
import type { Roadmap } from '@/types';

interface CreateRoadmapSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (roadmap: Roadmap) => void;
}

export function CreateRoadmapSheet({ open, onClose, onCreated }: CreateRoadmapSheetProps) {
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear + 1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    setIsLoading(true);
    
    try {
      const now = new Date().toISOString();
      const newRoadmap: Roadmap = {
        id: uuidv4(),
        title: title.trim(),
        description: description.trim() || undefined,
        startYear,
        endYear,
        months: {},
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now
      };
      
      await saveRoadmap(newRoadmap);
      
      if (onCreated) {
        onCreated(newRoadmap);
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setStartYear(currentYear);
      setEndYear(currentYear + 1);
      
      onClose();
    } catch (error) {
      console.error('Failed to create roadmap:', error);
      alert('Failed to create roadmap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="p-4">
        <SheetHeader>
          <SheetTitle>Create New Roadmap</SheetTitle>
          <SheetDescription>
            Create a new timeline to plan your goals and objectives.
          </SheetDescription>
        </SheetHeader>
        
        <FieldGroup>
          <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="title">Title *</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Career Goals 2025"
              required
            />
            <FieldDescription>
              A clear name for your roadmap
            </FieldDescription>
          </Field>
          
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="startYear">Start Year *</FieldLabel>
              <Input
                id="startYear"
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                min={2020}
                max={2100}
                required
              />
            </Field>
            
            <Field>
              <FieldLabel htmlFor="endYear">End Year *</FieldLabel>
              <Input
                id="endYear"
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                min={startYear}
                max={2100}
                required
              />
            </Field>
          </div>
          
          <SheetFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                'Create Roadmap'
              )}
            </Button>
          </SheetFooter>
        </form>
        </FieldGroup>
      </SheetContent>
    </Sheet>
  );
}
