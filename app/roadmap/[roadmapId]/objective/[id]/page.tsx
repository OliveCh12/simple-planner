'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Flag, Zap, Trash2, Save, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useRoadmapStore } from '@/store/roadmapStore';
import { saveRoadmap } from '@/lib/db';
import { formatDateDisplay } from '@/lib/date-utils';
import { ENERGY_LEVELS, PRIORITIES, STATUSES } from '@/lib/constants';
import type { Objective, EnergyLevel, Priority, ObjectiveStatus } from '@/types';

export default function ObjectivePage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = params.roadmapId as string;
  const objectiveId = params.id as string;
  
  const { roadmap, isLoading } = useRoadmap(roadmapId);
  const { updateObjective: updateObjectiveInStore, deleteObjective: deleteObjectiveFromStore } = useRoadmapStore();
  
  const [objective, setObjective] = useState<Objective | null>(null);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedObjective, setEditedObjective] = useState<Objective | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Find the objective in the roadmap
  useEffect(() => {
    if (roadmap) {
      for (const [key, month] of Object.entries(roadmap.months)) {
        const found = month.objectives.find(obj => obj.id === objectiveId);
        if (found) {
          setObjective(found);
          setEditedObjective(found);
          setMonthKey(key);
          break;
        }
      }
    }
  }, [roadmap, objectiveId]);

  const handleSave = async () => {
    if (!editedObjective || !monthKey || !roadmap) return;
    
    setIsSaving(true);
    try {
      // Update in store
      updateObjectiveInStore(monthKey, objectiveId, editedObjective);
      
      // Save to database
      await saveRoadmap(roadmap);
      
      setObjective(editedObjective);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save objective:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedObjective(objective);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!monthKey || !roadmap) return;
    
    if (confirm('Are you sure you want to delete this objective? This action cannot be undone.')) {
      try {
        deleteObjectiveFromStore(monthKey, objectiveId);
        await saveRoadmap(roadmap);
        router.push(`/roadmap/${roadmapId}`);
      } catch (error) {
        console.error('Failed to delete objective:', error);
        alert('Failed to delete objective. Please try again.');
      }
    }
  };

  const updateField = <K extends keyof Objective>(field: K, value: Objective[K]) => {
    if (editedObjective) {
      setEditedObjective({ ...editedObjective, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!roadmap || !objective) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Objective not found</p>
        <Button onClick={() => router.push(`/roadmap/${roadmapId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Roadmap
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/roadmap/${roadmapId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{roadmap.title}</h1>
                <p className="text-sm text-muted-foreground">Objective Details</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? (
                  <Input
                    value={editedObjective?.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="text-2xl font-bold"
                    placeholder="Objective title"
                  />
                ) : (
                  <span className="text-2xl">{objective.title}</span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Status and Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={editedObjective?.status}
                    onValueChange={(value) => updateField('status', value as ObjectiveStatus)}
                  >
                    <SelectTrigger className="w-[200px]">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Progress</Label>
                  <span className="text-sm text-muted-foreground">
                    {isEditing ? editedObjective?.progress : objective.progress}%
                  </span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={editedObjective?.progress}
                      onChange={(e) => updateField('progress', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editedObjective?.progress}
                      onChange={(e) => updateField('progress', parseInt(e.target.value))}
                      className="w-20"
                    />
                  </div>
                ) : (
                  <Progress value={objective.progress} className="h-3" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedObjective?.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={6}
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {objective.description || 'No description provided'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Range
                  </Label>
                  <div className="text-sm space-y-1">
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm">
                      {objective.duration} day{objective.duration !== 1 ? 's' : ''}
                    </p>
                    {objective.isPinned && (
                      <Badge variant="secondary">Pinned</Badge>
                    )}
                  </div>
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
                          variant={editedObjective?.priority === p.value ? 'default' : 'outline'}
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
                          variant={editedObjective?.energyLevel === level.value ? 'default' : 'outline'}
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
                      value={editedObjective?.category || ''}
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
                        value={editedObjective?.tags.join(', ')}
                        onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                        placeholder="Comma-separated tags"
                      />
                      <div className="flex flex-wrap gap-2">
                        {editedObjective?.tags.map((tag, index) => (
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
            </CardContent>
          </Card>

          {/* Notes */}
          {(objective.notes || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedObjective?.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={4}
                    placeholder="Additional notes..."
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {objective.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{formatDateDisplay(objective.createdAt, 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{formatDateDisplay(objective.updatedAt, 'MMM d, yyyy HH:mm')}</span>
              </div>
              {objective.completedAt && (
                <div className="flex justify-between text-green-600">
                  <span>Completed:</span>
                  <span>{formatDateDisplay(objective.completedAt, 'MMM d, yyyy HH:mm')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
