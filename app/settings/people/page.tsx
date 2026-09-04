"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Pencil, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ColorSwatch } from "@/components/settings/ColorSwatch";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Badge } from "@/components/ui/badge";
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
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEFAULT_SWATCH } from "@/lib/colors";
import { DomainError } from "@/lib/domain/items";
import { createPerson, updatePerson } from "@/lib/domain/people";
import { startDemoSeed } from "@/lib/seed";
import { usePlannerStore } from "@/store/plannerStore";
import type { Person } from "@/types";

type Draft = {
  name: string;
  kind: Person["kind"];
  email: string;
  color: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  kind: "human",
  email: "",
  color: DEFAULT_SWATCH,
});

function draftFrom(person: Person): Draft {
  return {
    name: person.name,
    kind: person.kind,
    email: person.email ?? "",
    color: person.color ?? DEFAULT_SWATCH,
  };
}

export default function PeopleSettingsPage() {
  const people = usePlannerStore((s) => s.people);
  const loadDirectory = usePlannerStore((s) => s.loadDirectory);
  const putPerson = usePlannerStore((s) => s.putPerson);
  const deletePerson = usePlannerStore((s) => s.deletePerson);

  const [editing, setEditing] = useState<Person | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void startDemoSeed().then(() => loadDirectory());
  }, [loadDirectory]);

  const sorted = useMemo(
    () => [...people].sort((a, b) => a.name.localeCompare(b.name)),
    [people]
  );

  const dialogOpen = creating || editing !== null;

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setCreating(true);
  };

  const openEdit = (person: Person) => {
    setCreating(false);
    setDraft(draftFrom(person));
    setEditing(person);
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
      const person = editing
        ? updatePerson(editing, {
            name: draft.name,
            kind: draft.kind,
            email: draft.email,
            color: draft.color,
          })
        : createPerson({
            name: draft.name,
            kind: draft.kind,
            email: draft.email,
            color: draft.color,
          });
      await putPerson(person);
      setCreating(false);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save person.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePerson(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete person.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SettingsSection
      title="People"
      description="Humans and AI agents you can assign to work. Global, not per plan."
    >
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus />
          Add person
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No people yet. Add yourself, or an agent.</p>
      ) : (
        <ItemGroup className="rounded-lg border">
          {sorted.map((person, index) => (
            <div key={person.id}>
              {index > 0 && <ItemSeparator />}
              <Item>
                <ItemMedia variant="icon" className="overflow-hidden">
                  <span
                    className="flex size-8 items-center justify-center text-white"
                    style={{ backgroundColor: person.color ?? DEFAULT_SWATCH }}
                  >
                    {person.kind === "agent" ? <Bot className="size-4" /> : <User className="size-4" />}
                  </span>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">
                    {person.name}
                    <Badge variant="secondary">{person.kind === "agent" ? "AI" : "Human"}</Badge>
                  </ItemTitle>
                  {person.email && <ItemDescription>{person.email}</ItemDescription>}
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${person.name}`}
                    onClick={() => openEdit(person)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${person.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setPendingDelete(person)}
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
            <DialogTitle>{editing ? "Edit person" : "New person"}</DialogTitle>
            <DialogDescription>Who can be assigned to tasks and events.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="person-name">Name</FieldLabel>
              <Input
                id="person-name"
                value={draft.name}
                autoFocus
                required
                placeholder="Ada, or Planner agent"
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>Kind</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label="Kind"
                value={draft.kind}
                onValueChange={(value) => {
                  if (value === "human" || value === "agent") {
                    setDraft((current) => ({ ...current, kind: value }));
                  }
                }}
              >
                <ToggleGroupItem value="human">
                  <User />
                  Human
                </ToggleGroupItem>
                <ToggleGroupItem value="agent">
                  <Bot />
                  AI
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="person-email">Email</FieldLabel>
              <Input
                id="person-email"
                type="email"
                value={draft.email}
                placeholder="Optional"
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
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
        title="Delete person"
        description={
          pendingDelete ? `Remove “${pendingDelete.name}” from assignees and attendees?` : ""
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
