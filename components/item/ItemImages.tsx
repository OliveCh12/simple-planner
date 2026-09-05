"use client";

import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createId } from "@/lib/id";
import { cn } from "@/lib/utils";
import type { ItemImage } from "@/types";

const MAX_BYTES = 1_500_000;

async function readImages(files: FileList | null): Promise<ItemImage[]> {
  if (!files?.length) return [];
  const next: ItemImage[] = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      continue;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Keep images under 1.5 MB.");
      continue;
    }
    const src = await readFile(file);
    next.push({ id: createId(), name: file.name, src });
  }
  return next;
}

/** Quiet "add image" affordance, usable in a section header or as an empty-state action. */
export function ImageAddButton({
  onAdd,
  className,
  label = "Image",
}: {
  onAdd: (images: ItemImage[]) => void;
  className?: string;
  label?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex h-6 cursor-pointer items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        className
      )}
    >
      <ImagePlus className="size-3" />
      {label}
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          const input = event.target;
          void readImages(input.files).then((images) => {
            if (images.length) onAdd(images);
            input.value = "";
          });
        }}
      />
    </label>
  );
}

interface ItemImagesProps {
  images: ItemImage[];
  onChange: (images: ItemImage[]) => void;
}

/** Thumbnails only; adding lives in `ImageAddButton`. Renders nothing when empty. */
export function ItemImages({ images, onChange }: ItemImagesProps) {
  if (images.length === 0) return null;
  return (
    <ul className="grid grid-cols-3 gap-1.5">
      {images.map((image) => (
        <li key={image.id} className="group relative overflow-hidden rounded-md border border-cal-line-strong">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.name} className="aspect-[4/3] w-full object-cover" />
          <Button
            type="button"
            size="icon-xs"
            variant="secondary"
            className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Remove ${image.name}`}
            onClick={() => onChange(images.filter((entry) => entry.id !== image.id))}
          >
            <X />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
