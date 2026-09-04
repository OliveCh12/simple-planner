"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ColorSwatch } from "@/components/settings/ColorSwatch";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { createCategory, updateCategory } from "@/lib/domain/categories";
import { DomainError } from "@/lib/domain/items";
import { startDemoSeed } from "@/lib/seed";
import { usePlannerStore } from "@/store/plannerStore";
import type { Category } from "@/types";

type Draft = { name: string; color: string };

const emptyDraft = (): Draft => ({ name: "", color: DEFAULT_SWATCH });

export default function CategoriesSettingsPage() {
  const categories = usePlannerStore((s) => s.categories);
  const loadDirectory = usePlannerStore((s) => s.loadDirectory);
  const putCategory = usePlannerStore((s) => s.putCategory);
  const deleteCategory = usePlannerStore((s) => s.deleteCategory);

  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void startDemoSeed().then(() => loadDirectory());
  }, [loadDirectory]);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const dialogOpen = creating || editing !== null;

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setCreating(true);
  };

  const openEdit = (category: Category) => {
    setCreating(false);
    setDraft({ name: category.name, color: category.color });
    setEditing(category);
  };

  const closeDialog = () => {
    if (saving) return;
    setCreating(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const category = editing
        ? updateCategory(editing, { name: draft.name, color: draft.color })
        : createCategory({ name: draft.name, color: draft.color });
      await putCategory(category);
      setCreating(false);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SettingsSection
      title="Categories"
      description="Labels for grouping work. Global, not per plan."
    >
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Add category
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet. Health, career, home…</p>
      ) : (
        <ItemGroup className="rounded-lg border">
          {sorted.map((category, index) => (
            <div key={category.id}>
              {index > 0 && <ItemSeparator />}
              <Item>
                <ItemMedia variant="icon" className="overflow-hidden">
                  <span className="size-8" style={{ backgroundColor: category.color }} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{category.name}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => openEdit(category)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${category.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setPendingDelete(category)}
                  >
                    <Trash2 />
                  </Button>
                </ItemActions>
              </Item>
            </div>
          ))}
        </ItemGroup>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>A color and a short name.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                id="category-name"
                value={draft.name}
                autoFocus
                required
                placeholder="Health"
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>Color</FieldLabel>
              <ColorSwatch
                value={draft.color}
                onChange={(color) => setDraft((current) => ({ ...current, color }))}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !draft.name.trim()}>
              {saving && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete category"
        description={
          pendingDelete ? `Remove the “${pendingDelete.name}” category from items that use it?` : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      />
    </SettingsSection>
  );
}
