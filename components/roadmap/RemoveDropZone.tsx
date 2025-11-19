'use client';

import { Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/react';
import { Card } from '@/components/ui/card';

interface RemoveDropZoneProps {
  isDragging: boolean;
}

export function RemoveDropZone({ isDragging }: RemoveDropZoneProps) {
  const { ref, isDropTarget } = useDroppable({
    id: 'remove-zone',
  });

  return (
    <Card
      ref={ref}
      role="button"
      aria-hidden={!isDragging}
      aria-live={isDropTarget ? 'assertive' : 'polite'}
      title="Drop to delete objective"
      aria-label="Drop to delete objective"
      data-dropzone="remove-zone"
      className={`
        fixed bottom-6 left-1/2 transform -translate-x-1/2 w-36 h-36 sm:w-44 sm:h-44 flex flex-col items-center justify-center
        transition-all duration-200 z-400 pointer-events-auto
        ${isDropTarget
          ? 'bg-destructive text-destructive-foreground scale-110 shadow-lg ring-2 ring-destructive'
          : 'bg-destructive/80 text-destructive-foreground hover:bg-destructive shadow-md'
        }
        ${isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className={`absolute inset-0 flex items-center justify-center ${isDropTarget ? 'animate-pulse' : ''}`} aria-hidden>
        <span className="sr-only">Delete drop zone</span>
      </div>
      <Trash2 className={`h-10 w-10 transition-transform ${isDropTarget ? 'scale-125 rotate-6' : ''}`} aria-hidden={false} />
      <span className={`mt-2 text-sm font-medium transition-opacity ${isDropTarget ? 'opacity-100' : (isDragging ? 'opacity-60' : 'opacity-0')}`} aria-hidden={!isDragging}>
        {isDropTarget ? 'Release to delete' : 'Drop to delete'}
      </span>
    </Card>
  );
}