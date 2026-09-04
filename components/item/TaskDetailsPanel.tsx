"use client";

import { ItemEditor } from "@/components/item/ItemEditor";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { PlanItem } from "@/types";

interface TaskDetailsPanelProps {
  item: PlanItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export function TaskDetailsPanel({ item, open, onOpenChange, children }: TaskDetailsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription>Edit this item without leaving the plan.</SheetDescription>
        </SheetHeader>
        <ItemEditor item={item} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
