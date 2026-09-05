"use client";

import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createId } from "@/lib/id";
import type { ItemImage } from "@/types";

const MAX_BYTES = 1_500_000;

interface ItemImagesProps {
  images: ItemImage[];
  onChange: (images: ItemImage[]) => void;
}

export function ItemImages({ images, onChange }: ItemImagesProps) {
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...images];
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
    onChange(next);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Images</h2>
        <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ImagePlus className="size-3.5" />
          Add
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">Optional photos, tickets or references.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {images.map((image) => (
            <li key={image.id} className="group relative overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.name} className="h-24 w-full object-cover" />
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${image.name}`}
                onClick={() => onChange(images.filter((entry) => entry.id !== image.id))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
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
