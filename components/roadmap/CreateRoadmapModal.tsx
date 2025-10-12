'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveRoadmap } from '@/lib/db';
import type { Roadmap } from '@/types';

interface CreateRoadmapModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (roadmap: Roadmap) => void;
}

export function CreateRoadmapModal({ open, onClose, onCreated }: CreateRoadmapModalProps) {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Roadmap</DialogTitle>
          <DialogDescription>
            Create a new timeline to plan your goals and objectives.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Career Goals 2025"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startYear" className="block text-sm font-medium mb-1">
                Start Year *
              </label>
              <Input
                id="startYear"
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                min={2020}
                max={2100}
                required
              />
            </div>
            
            <div>
              <label htmlFor="endYear" className="block text-sm font-medium mb-1">
                End Year *
              </label>
              <Input
                id="endYear"
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                min={startYear}
                max={2100}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Creating...' : 'Create Roadmap'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
