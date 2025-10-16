'use client';

import { useState, useEffect } from 'react';
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
import { sampleRoadmapData } from '@/data/sampleData';

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
  const [endYear, setEndYear] = useState(currentYear);
  const [isMultiYear, setIsMultiYear] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update endYear when startYear changes or multi-year toggles
  useEffect(() => {
    if (isMultiYear) {
      setEndYear(startYear + 2);
    } else {
      setEndYear(startYear);
    }
  }, [startYear, isMultiYear]);

  const handleCreateSample = () => {
    setTitle(sampleRoadmapData.title);
    setDescription(sampleRoadmapData.description);
    setStartYear(currentYear);
    setIsMultiYear(true);
  };

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

      // Add sample objectives if using template
      if (title.trim() === sampleRoadmapData.title) {
        const now = new Date().toISOString();
        sampleRoadmapData.objectives.forEach(({ month, objectives }) => {
          const [yearStr, monthStr] = month.split('-');
          const year = parseInt(yearStr);
          const monthNum = parseInt(monthStr);
          
          // Adjust year based on startYear
          const adjustedYear = startYear + (year - 2025);
          const adjustedMonth = `${adjustedYear}-${monthStr.padStart(2, '0')}`;
          
          newRoadmap.months[adjustedMonth] = {
            id: `${adjustedMonth}-${Date.now()}`,
            year: adjustedYear,
            month: monthNum,
            objectives: objectives.map(obj => ({
              ...obj,
              id: uuidv4(),
              createdAt: now,
              updatedAt: now
            })),
            createdAt: now,
            updatedAt: now
          };
        });
      }
      
      await saveRoadmap(newRoadmap);
      
      if (onCreated) {
        onCreated(newRoadmap);
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setStartYear(currentYear);
      setEndYear(currentYear);
      setIsMultiYear(false);
      
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

        {/* Quick Options */}
        <div className="space-y-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quick Start</span>
            <Button type="button" variant="outline" size="sm" onClick={handleCreateSample}>
              Use Sample Template
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Timeline</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isMultiYear ? 'Multi-year' : 'Single year'}
              </span>
              <Button
                type="button"
                variant={isMultiYear ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMultiYear(!isMultiYear)}
              >
                {isMultiYear ? 'Multi' : 'Single'}
              </Button>
            </div>
          </div>
        </div>
        
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
            
            {isMultiYear && (
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
            )}
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
