'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Flag, Zap, Trash2, X } from 'lucide-react';
import type { Objective, EnergyLevel, Priority, ObjectiveStatus } from '@/types';
import { ENERGY_LEVELS, PRIORITIES, STATUSES } from '@/lib/constants';
import { formatDateDisplay } from '@/lib/date-utils';

interface ObjectiveDetailModalProps {
  open: boolean;
  onClose: () => void;
  objective: Objective;
  onUpdate: (updates: Partial<Objective>) => void;
  onDelete: () => void;
}

export function ObjectiveDetailModal({ 
  open, 
  onClose, 
  objective, 
  onUpdate,
  onDelete 
}: ObjectiveDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedObjective, setEditedObjective] = useState(objective);

  const handleSave = () => {
    onUpdate(editedObjective);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedObjective(objective);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this objective? This action cannot be undone.')) {
      onDelete();
      onClose();
    }
  };

  const updateField = <K extends keyof Objective>(field: K, value: Objective[K]) => {
    setEditedObjective(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedObjective.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Objective title"
                />
              ) : (
                <DialogTitle className="text-2xl">{objective.title}</DialogTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Status</Label>
              {isEditing ? (
                <Select
                  value={editedObjective.status}
                  onValueChange={(value) => updateField('status', value as ObjectiveStatus)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={STATUSES.find(s => s.value === objective.status)?.color}>
                  {STATUSES.find(s => s.value === objective.status)?.label}
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Label>Progress</Label>
                <span className="text-muted-foreground">{isEditing ? editedObjective.progress : objective.progress}%</span>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={editedObjective.progress}
                    onChange={(e) => updateField('progress', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editedObjective.progress}
                    onChange={(e) => updateField('progress', parseInt(e.target.value))}
                    className="w-20"
                  />
                </div>
              ) : (
                <Progress value={objective.progress} className="h-2" />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                value={editedObjective.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {objective.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="text-sm">
                <p>{formatDateDisplay(objective.startDate, 'MMM d, yyyy')}</p>
                <p className="text-muted-foreground">to</p>
                <p>{formatDateDisplay(objective.endDate, 'MMM d, yyyy')}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </Label>
              <p className="text-sm">
                {objective.duration} day{objective.duration !== 1 ? 's' : ''}
                {objective.isPinned && (
                  <Badge variant="secondary" className="ml-2">Pinned</Badge>
                )}
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Priority
              </Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <Badge
                      key={p.value}
                      variant={editedObjective.priority === p.value ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => updateField('priority', p.value)}
                    >
                      {p.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge variant="outline" className={PRIORITIES.find(p => p.value === objective.priority)?.color}>
                  {PRIORITIES.find(p => p.value === objective.priority)?.label}
                </Badge>
              )}
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Energy Level
              </Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {ENERGY_LEVELS.map((level) => (
                    <Badge
                      key={level.value}
                      variant={editedObjective.energyLevel === level.value ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => updateField('energyLevel', level.value)}
                    >
                      {level.label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Badge variant="outline">
                  {ENERGY_LEVELS.find(e => e.value === objective.energyLevel)?.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Category */}
          {(objective.category || isEditing) && (
            <div className="space-y-2">
              <Label>Category</Label>
              {isEditing ? (
                <Input
                  value={editedObjective.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="e.g., Work, Personal, Health"
                />
              ) : (
                <Badge variant="secondary">{objective.category}</Badge>
              )}
            </div>
          )}

          {/* Tags */}
          {(objective.tags.length > 0 || isEditing) && (
            <div className="space-y-2">
              <Label>Tags</Label>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedObjective.tags.join(', ')}
                    onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    placeholder="Comma-separated tags"
                  />
                  <div className="flex flex-wrap gap-2">
                    {editedObjective.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => {
                            const newTags = editedObjective.tags.filter((_, i) => i !== index);
                            updateField('tags', newTags);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {objective.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subtasks */}
          {objective.subtasks && objective.subtasks.length > 0 && (
            <div className="space-y-2">
              <Label>Subtasks ({objective.subtasks.filter(s => s.completed).length}/{objective.subtasks.length} completed)</Label>
              <div className="space-y-2">
                {objective.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={(e) => {
                        const newSubtasks = objective.subtasks?.map(s =>
                          s.id === subtask.id ? { ...s, completed: e.target.checked } : s
                        );
                        updateField('subtasks', newSubtasks);
                      }}
                      className="rounded"
                      disabled={!isEditing}
                    />
                    <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(objective.notes || isEditing) && (
            <div className="space-y-2">
              <Label>Notes</Label>
              {isEditing ? (
                <Textarea
                  value={editedObjective.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {objective.notes}
                </p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>Created: {formatDateDisplay(objective.createdAt, 'MMM d, yyyy HH:mm')}</p>
            <p>Updated: {formatDateDisplay(objective.updatedAt, 'MMM d, yyyy HH:mm')}</p>
            {objective.completedAt && (
              <p>Completed: {formatDateDisplay(objective.completedAt, 'MMM d, yyyy HH:mm')}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
