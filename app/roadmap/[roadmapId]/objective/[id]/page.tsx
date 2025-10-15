'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Flag,
  Zap,
  Trash2,
  Save,
  Edit2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SubHeader } from '@/components/layout/SubHeader';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useRoadmapStore } from '@/store/roadmapStore';
import { saveRoadmap } from '@/lib/db';
import { formatDateDisplay } from '@/lib/date-utils';
import { ENERGY_LEVELS, PRIORITIES, STATUSES } from '@/lib/constants';
import type {
  Objective,
  ObjectiveStatus,
} from '@/types';

import { containerClasses } from '@/lib/utils';

export default function ObjectivePage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = params.roadmapId as string;
  const objectiveId = params.id as string;

  const { roadmap, isLoading } = useRoadmap(roadmapId);
  const {
    updateObjective: updateObjectiveInStore,
    deleteObjective: deleteObjectiveFromStore,
  } = useRoadmapStore();

  const [objective, setObjective] = useState<Objective | null>(null);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedObjective, setEditedObjective] = useState<Objective | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (roadmap) {
      for (const [key, month] of Object.entries(roadmap.months)) {
        const found = month.objectives.find((obj) => obj.id === objectiveId);
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
      updateObjectiveInStore(monthKey, objectiveId, editedObjective);
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
    if (
      confirm(
        'Are you sure you want to delete this objective? This action cannot be undone.'
      )
    ) {
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

  const updateField = <K extends keyof Objective>(
    field: K,
    value: Objective[K]
  ) => {
    setEditedObjective((prev) => (prev ? { ...prev, [field]: value } : null));
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
      <SubHeader
        backUrl={`/roadmap/${roadmapId}`}
        title={objective.title}
        breadcrumb={roadmap.title}
        actions={[
          {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4 mr-2" />,
            onClick: handleDelete,
            variant: "outline" as const,
            size: "sm" as const,
            className: "text-destructive hover:text-destructive",
          },
          ...(isEditing ? [
            {
              label: "Cancel",
              icon: <X className="h-4 w-4 mr-2" />,
              onClick: handleCancel,
              variant: "outline" as const,
              size: "sm" as const,
              disabled: isSaving,
            },
            {
              label: isSaving ? 'Saving...' : 'Save Changes',
              icon: <Save className="h-4 w-4 mr-2" />,
              onClick: handleSave,
              size: "sm" as const,
              disabled: isSaving,
            }
          ] : [
            {
              label: "Edit",
              icon: <Edit2 className="h-4 w-4 mr-2" />,
              onClick: () => setIsEditing(true),
              size: "sm" as const,
            }
          ])
        ]}
      />



      {/* Content */}
      <div className="py-8">
        <Card className={containerClasses()}>
          <CardContent className="space-y-8 p-8">
          {/* Title */}
          <div>
            {isEditing ? (
              <Input
                value={editedObjective?.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Objective title"
                className="text-3xl font-bold border-none p-0 h-auto focus-visible:ring-0"
              />
            ) : (
              <h1 className="text-3xl font-bold">{objective.title}</h1>
            )}
          </div>

          {/* Status & Progress */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Status & Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={editedObjective?.status}
                    onValueChange={(v) =>
                      updateField('status', v as ObjectiveStatus)
                    }
                  >
                    <SelectTrigger>
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
                  <Badge
                    className={
                      STATUSES.find((s) => s.value === objective.status)
                        ?.color
                    }
                  >
                    {
                      STATUSES.find((s) => s.value === objective.status)
                        ?.label
                    }
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between items-center">
                  Progress
                  <span className="text-sm font-normal text-muted-foreground">
                    {isEditing
                      ? editedObjective?.progress
                      : objective.progress}
                    %
                  </span>
                </Label>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={editedObjective?.progress}
                      onChange={(e) =>
                        updateField('progress', Number(e.target.value))
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editedObjective?.progress}
                      onChange={(e) =>
                        updateField('progress', Number(e.target.value))
                      }
                      className="w-20"
                    />
                  </div>
                ) : (
                  <Progress value={objective.progress} className="h-3" />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Description
            </h2>
            {isEditing ? (
              <Textarea
                value={editedObjective?.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={5}
                placeholder="Add a description..."
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {objective.description || 'No description provided'}
              </p>
            )}
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date Range */}
              <DetailSection icon={<Calendar className="h-4 w-4" />} label="Date Range">
                <p>{formatDateDisplay(objective.startDate, 'MMM d, yyyy')}</p>
                <p className="text-muted-foreground">to</p>
                <p>{formatDateDisplay(objective.endDate, 'MMM d, yyyy')}</p>
              </DetailSection>

              {/* Duration */}
              <DetailSection icon={<Clock className="h-4 w-4" />} label="Duration">
                <div className="flex items-center gap-2">
                  <span>
                    {objective.duration} day{objective.duration !== 1 ? 's' : ''}
                  </span>
                  {objective.isPinned && (
                    <Badge variant="secondary">Pinned</Badge>
                  )}
                </div>
              </DetailSection>

              {/* Priority */}
              <DetailSection icon={<Flag className="h-4 w-4" />} label="Priority">
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((p) => (
                      <Badge
                        key={p.value}
                        variant={
                          editedObjective?.priority === p.value
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => updateField('priority', p.value)}
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={
                      PRIORITIES.find((p) => p.value === objective.priority)
                        ?.color
                    }
                  >
                    {
                      PRIORITIES.find((p) => p.value === objective.priority)
                        ?.label
                    }
                  </Badge>
                )}
              </DetailSection>

              {/* Energy Level */}
              <DetailSection icon={<Zap className="h-4 w-4" />} label="Energy Level">
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {ENERGY_LEVELS.map((level) => (
                      <Badge
                        key={level.value}
                        variant={
                          editedObjective?.energyLevel === level.value
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          updateField('energyLevel', level.value)
                        }
                      >
                        {level.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="outline">
                    {
                      ENERGY_LEVELS.find(
                        (e) => e.value === objective.energyLevel
                      )?.label
                    }
                  </Badge>
                )}
              </DetailSection>
            </div>

            {/* Category */}
            {(objective.category || isEditing) && (
              <div className="mt-6 space-y-2">
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
              <div className="mt-6 space-y-2">
                <Label>Tags</Label>
                {isEditing ? (
                  <TagEditor
                    tags={editedObjective?.tags || []}
                    onUpdate={(newTags) => updateField('tags', newTags)}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {objective.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {(objective.notes || isEditing) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Edit2 className="h-5 w-5" />
                  Notes
                </h2>
                {isEditing ? (
                  <Textarea
                    value={editedObjective?.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={4}
                    placeholder="Additional notes..."
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {objective.notes}
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Created:</span>
                <time dateTime={objective.createdAt}>
                  {formatDateDisplay(objective.createdAt, 'MMM d, yyyy HH:mm')}
                </time>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <time dateTime={objective.updatedAt}>
                  {formatDateDisplay(objective.updatedAt, 'MMM d, yyyy HH:mm')}
                </time>
              </div>
              {objective.completedAt && (
                <div className="flex justify-between text-green-600">
                  <span>Completed:</span>
                  <time dateTime={objective.completedAt}>
                    {formatDateDisplay(objective.completedAt, 'MMM d, yyyy HH:mm')}
                  </time>
                </div>
              )}
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Helper Components ---

interface DetailSectionProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function DetailSection({ icon, label, children }: DetailSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 font-medium">
        {icon}
        {label}
      </Label>
      <div className="text-sm">{children}</div>
    </div>
  );
}

interface TagEditorProps {
  tags: string[];
  onUpdate: (tags: string[]) => void;
}

function TagEditor({ tags, onUpdate }: TagEditorProps) {
  const addTag = (input: string) => {
    const newTags = [...new Set([...tags, ...input.split(',').map(t => t.trim()).filter(Boolean)])];
    onUpdate(newTags);
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onUpdate(newTags);
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Type tags, separated by commas"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
        onBlur={(e) => {
          if (e.target.value.trim()) {
            addTag(e.target.value);
            e.target.value = '';
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary">
            {tag}
            <X
              className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => removeTag(i)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
}