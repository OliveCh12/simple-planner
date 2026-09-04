"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { DateRangeChip, EnergyChip, StatusChip } from "@/components/task/TaskProperties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteTask } from "@/hooks/useTaskActions";
import { usePlanStore } from "@/store/planStore";
import type { Task, TaskStatus } from "@/types";

interface TaskEditorProps {
  task: Task;
  onClose: () => void;
}

export function TaskEditor({ task, onClose }: TaskEditorProps) {
  const updateTask = usePlanStore((s) => s.updateTask);
  const deleteTask = useDeleteTask();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);

  const persist = (updates: Partial<Task>) => {
    void updateTask(task.id, updates);
  };

  const commitTitle = (value: string) => {
    const next = value.trim();
    if (!next) {
      setTitle(task.title);
      return;
    }
    if (next !== task.title) persist({ title: next });
  };

  const commitNotes = (value: string) => {
    if (value !== task.notes) persist({ notes: value });
  };

  const close = (save = true) => {
    if (save) {
      commitTitle(title);
      commitNotes(notes);
    }
    onClose();
  };

  const setStatus = (next: TaskStatus) => {
    persist({
      status: next,
      completedAt: next === "completed" ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={title}
          aria-label="Title"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => commitTitle(title)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              close();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              close(false);
            }
          }}
          className="-ml-1 h-7 flex-1 rounded-sm border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:bg-muted/60 focus-visible:ring-0 dark:bg-transparent"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Delete task"
              className="-mr-1 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => {
                onClose();
                void deleteTask(task);
              }}
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
      <Textarea
        value={notes}
        placeholder="Add notes…"
        aria-label="Notes"
        rows={2}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => commitNotes(notes)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close(false);
          }
        }}
        className="-mx-1 min-h-0 w-[calc(100%+0.5rem)] resize-none rounded-sm border-0 bg-transparent px-1 py-1 text-xs text-muted-foreground shadow-none focus-visible:bg-muted/60 focus-visible:ring-0 md:text-xs dark:bg-transparent"
      />
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <StatusChip value={task.status} onChange={setStatus} />
        <EnergyChip value={task.energy} onChange={(energy) => persist({ energy })} />
        <DateRangeChip
          start={task.start}
          end={task.end}
          onChange={(start, end) => persist({ start, end })}
        />
      </div>
    </div>
  );
}
