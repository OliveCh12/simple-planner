"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface OccurrenceEditDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onThis: () => void;
  onSeries: () => void;
  onOpenChange: (open: boolean) => void;
}

export function OccurrenceEditDialog({
  open,
  title = "Recurring item",
  description = "Apply this change to this occurrence only, or to the whole series.",
  onThis,
  onSeries,
  onOpenChange,
}: OccurrenceEditDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button type="button" onClick={onThis}>
            This occurrence
          </Button>
          <Button type="button" variant="outline" onClick={onSeries}>
            Entire series
          </Button>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
