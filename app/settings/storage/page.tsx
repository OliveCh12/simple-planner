"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NotConfiguredError } from "@/lib/repository/types";
import { RemoteRepository } from "@/lib/repository/remote";
import { setRepository } from "@/lib/repository/create";
import { readStorageConfig, writeStorageConfig, type StorageConfig } from "@/lib/storage-config";
import { usePlannerStore } from "@/store/plannerStore";

export default function StorageSettingsPage() {
  const stored = readStorageConfig();
  const [kind, setKind] = useState<StorageConfig["kind"]>(stored.kind);
  const [url, setUrl] = useState(stored.kind === "remote" ? stored.url : "");
  const [token, setToken] = useState(stored.kind === "remote" ? stored.token : "");
  const [testing, setTesting] = useState(false);

  const save = () => {
    const config: StorageConfig =
      kind === "remote" ? { kind: "remote", url: url.trim(), token: token.trim() } : { kind: "browser" };
    writeStorageConfig(config);
    setRepository(undefined);
    usePlannerStore.getState().reset();
    toast.success(kind === "browser" ? "Using this browser." : "Sync target saved. The open-source server is not running yet.");
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      await new RemoteRepository().plans.list();
      toast.success("Connected");
    } catch (error) {
      const message =
        error instanceof NotConfiguredError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Connection failed";
      toast.error(message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <SettingsSection
      title="Storage"
      description="Plans stay in this browser by default. A sync server can be pointed at later; the URL and token are never written into backups."
    >
      <FieldGroup className="gap-6">
        <Field>
          <FieldLabel>Where to store plans</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={kind}
            onValueChange={(value) => {
              if (value === "browser" || value === "remote") setKind(value);
            }}
          >
            <ToggleGroupItem value="browser">This browser</ToggleGroupItem>
            <ToggleGroupItem value="remote">Sync server</ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {kind === "remote" && (
          <>
            <Field>
              <FieldLabel htmlFor="sync-url">Server URL</FieldLabel>
              <Input
                id="sync-url"
                type="url"
                placeholder="https://sync.example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sync-token">Token</FieldLabel>
              <Input
                id="sync-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(event) => setToken(event.target.value)}
              />
              <FieldDescription>Kept in localStorage only, never in export JSON.</FieldDescription>
            </Field>
            <Button type="button" variant="outline" size="sm" onClick={() => void testConnection()} disabled={testing}>
              Test connection
            </Button>
          </>
        )}

        <div>
          <Button type="button" onClick={save}>
            Save
          </Button>
        </div>
      </FieldGroup>
    </SettingsSection>
  );
}
