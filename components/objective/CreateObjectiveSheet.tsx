"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Objective, EnergyLevel, Priority } from "@/types";
import { ENERGY_LEVELS, PRIORITIES } from "@/lib/constants";
import { createISODate, getDaysInMonthForDate } from "@/lib/date-utils";

interface CreateObjectiveSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (objective: Objective) => void;
  monthKey: string; // Format: "2025-10"
}

export function CreateObjectiveSheet({
  open,
  onClose,
  onCreated,
  monthKey,
}: CreateObjectiveSheetProps) {
  const [year, month] = monthKey.split("-").map(Number);
  
  // Validate monthKey parsing - fallback to current month if invalid
  const isValidMonthKey = !isNaN(year) && !isNaN(month) && month >= 1 && month <= 12;
  const fallbackYear = new Date().getFullYear();
  const fallbackMonth = new Date().getMonth() + 1;
  const validYear = isValidMonthKey ? year : fallbackYear;
  const validMonth = isValidMonthKey ? month : fallbackMonth;
  
  const daysInMonth = getDaysInMonthForDate(validYear, validMonth);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(daysInMonth);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update endDay when month changes
  useEffect(() => {
    setEndDay(daysInMonth);
    setStartDay(1);
  }, [daysInMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsLoading(true);

    try {
      const startDate = createISODate(validYear, validMonth, startDay);
      const endDate = createISODate(validYear, validMonth, endDay);
      const duration = endDay - startDay + 1;
      const isPinned = duration >= 28; // Pin if it spans most/all of the month

      const now = new Date().toISOString();
      const newObjective: Objective = {
        id: uuidv4(),
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
        duration,
        energyLevel,
        priority,
        status: "pending",
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
        progress: 0,
        isPinned,
        createdAt: now,
        updatedAt: now,
      };

      if (onCreated) {
        onCreated(newObjective);
      }

      // Reset form
      setTitle("");
      setDescription("");
      setStartDay(1);
      setEndDay(daysInMonth);
      setEnergyLevel("medium");
      setPriority("medium");
      setCategory("");
      setTags("");
      setNotes("");

      onClose();
    } catch (error) {
      console.error("Failed to create objective:", error);
      alert("Failed to create objective. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Objective</SheetTitle>
          <SheetDescription>
            Add a new objective for{" "}
            {new Date(validYear, validMonth - 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Launch new product feature"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about this objective..."
              rows={4}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDay">Start Day *</Label>
              <Input
                id="startDay"
                type="number"
                value={startDay}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStartDay(Math.max(1, Math.min(daysInMonth, val)));
                }}
                min={1}
                max={daysInMonth}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDay">End Day *</Label>
              <Input
                id="endDay"
                type="number"
                value={endDay}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setEndDay(Math.max(startDay, Math.min(daysInMonth, val)));
                }}
                min={startDay}
                max={daysInMonth}
                required
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Duration: {endDay - startDay + 1} day(s)
            {endDay - startDay + 1 >= 28 && " (Will be pinned to top)"}
          </div>

          {/* Energy Level */}
          <div className="space-y-2">
            <Label>Energy Level *</Label>
            <div className="flex gap-2 flex-wrap">
              {ENERGY_LEVELS.map((level) => (
                <Badge
                  key={level.value}
                  variant={energyLevel === level.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setEnergyLevel(level.value)}
                >
                  {level.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority *</Label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => (
                <Badge
                  key={p.value}
                  variant={priority === p.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setPriority(p.value)}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal, Health"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separate tags with commas (e.g., urgent, client-work)"
            />
            {tags && (
              <div className="flex gap-1 flex-wrap mt-2">
                {tags.split(",").map((tag, i) => {
                  const trimmed = tag.trim();
                  return trimmed ? (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {trimmed}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or context..."
              rows={2}
            />
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Creating..." : "Create Objective"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
