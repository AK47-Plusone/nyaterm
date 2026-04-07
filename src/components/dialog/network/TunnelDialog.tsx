import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { TunnelConfig } from "@/types/global";
import { ConnectionCombobox, type ConnectionOption } from "./shared";

export function createTunnelDraft(tunnel?: TunnelConfig | null): TunnelConfig {
  return (
    tunnel ?? {
      id: "",
      name: "",
      tunnel_type: "local",
      connection_id: undefined,
      listen_port: 0,
      target_host: "127.0.0.1",
      target_port: 0,
      is_open: false,
      auto_open: false,
      bind_localhost: true,
    }
  );
}

function generateDefaultName(form: TunnelConfig, t: (key: string) => string): string {
  if (form.tunnel_type === "dynamic") {
    return `${t("network.dynamicTunnel")} · SOCKS5 ${form.listen_port || "?"}`;
  }
  const target =
    form.target_host && form.target_port
      ? `${form.target_host}:${form.target_port}`
      : "?";
  const label =
    form.tunnel_type === "remote" ? t("network.remoteTunnel") : t("network.localTunnel");
  return `${label} · ${form.listen_port || "?"} → ${target}`;
}

export function TunnelDialog({
  open,
  tunnel,
  connectionOptions,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  tunnel: TunnelConfig | null;
  connectionOptions: ConnectionOption[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tunnel: TunnelConfig) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TunnelConfig>(createTunnelDraft());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(createTunnelDraft(tunnel));
    setError("");
  }, [open, tunnel]);

  const handleSubmit = async () => {
    if (!form.connection_id) {
      setError(t("network.connectionRequired"));
      return;
    }
    if (!form.listen_port || form.listen_port < 1 || form.listen_port > 65535) {
      setError(t("network.tunnelListenPortRequired"));
      return;
    }
    if (
      form.tunnel_type !== "dynamic" &&
      (!form.target_host.trim() ||
        !form.target_port ||
        form.target_port < 1 ||
        form.target_port > 65535)
    ) {
      setError(t("network.tunnelTargetRequired"));
      return;
    }

    setError("");
    const finalName = form.name.trim() || generateDefaultName(form, t);
    await onSave({
      ...form,
      name: finalName,
      target_host: form.target_host.trim() || "127.0.0.1",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{tunnel ? t("network.editTunnel") : t("network.newTunnel")}</DialogTitle>
          <DialogDescription>{t("network.tunnelDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* 1. Connection - "based on who" */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t("network.selectedConnection")}</Label>
            <ConnectionCombobox
              value={form.connection_id ?? ""}
              options={connectionOptions}
              placeholder={t("network.connectionPickerPlaceholder")}
              searchPlaceholder={t("network.searchConnections")}
              emptyText={t("savedConnections.noResults")}
              missingSelectionLabel={t("network.connectionMissing")}
              onChange={(id) => {
                setForm((prev) => ({ ...prev, connection_id: id }));
                setError("");
              }}
            />
          </div>

          {/* 2. Tunnel Type - "do what" */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t("network.tunnelType")}</Label>
            <Select
              value={form.tunnel_type}
              onValueChange={(value) => setForm((prev) => ({ ...prev, tunnel_type: value }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">{t("network.localTunnel")}</SelectItem>
                <SelectItem value="remote">{t("network.remoteTunnel")}</SelectItem>
                <SelectItem value="dynamic">{t("network.dynamicTunnel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. Forwarding Rules */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("network.listenPort")}</Label>
              <NumberInput
                className="h-9 text-sm [&_button]:h-9 [&_button]:w-9 [&_input]:h-9 [&_input]:text-sm"
                min={1}
                max={65535}
                value={form.listen_port}
                onChange={(value) => setForm((prev) => ({ ...prev, listen_port: value || 0 }))}
              />
            </div>
            {form.tunnel_type !== "dynamic" ? (
              <div className="space-y-1.5">
                <Label className="text-sm">{t("network.targetPort")}</Label>
                <NumberInput
                  className="h-9 text-sm [&_button]:h-9 [&_button]:w-9 [&_input]:h-9 [&_input]:text-sm"
                  min={1}
                  max={65535}
                  value={form.target_port}
                  onChange={(value) => setForm((prev) => ({ ...prev, target_port: value || 0 }))}
                />
              </div>
            ) : null}
          </div>

          {form.tunnel_type !== "dynamic" ? (
            <div className="space-y-1.5">
              <Label className="text-sm">{t("network.targetHost")}</Label>
              <Input
                className="h-9 text-sm"
                placeholder="127.0.0.1"
                value={form.target_host}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, target_host: event.target.value }))
                }
              />
            </div>
          ) : null}

          {/* 4. Advanced Options */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center gap-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("network.advancedOptions")}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 grid gap-3">
              <label
                className="flex items-center justify-between rounded-md border px-3 py-2"
                style={{
                  borderColor: "var(--df-border)",
                  backgroundColor: "color-mix(in srgb, var(--df-bg-hover) 55%, transparent)",
                }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--df-text)" }}>
                    {t("network.autoOpen")}
                  </div>
                  <p className="text-xs" style={{ color: "var(--df-text-dimmed)" }}>
                    {t("network.tunnelConnectionHint")}
                  </p>
                </div>
                <Switch
                  checked={form.auto_open}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, auto_open: checked }))
                  }
                />
              </label>

              <div
                className="flex items-center gap-2 rounded-md border px-3 py-2"
                style={{ borderColor: "var(--df-border)" }}
              >
                <Checkbox
                  id="bind-localhost"
                  checked={form.bind_localhost}
                  onCheckedChange={(value) =>
                    setForm((prev) => ({ ...prev, bind_localhost: Boolean(value) }))
                  }
                />
                <Label htmlFor="bind-localhost" className="text-sm">
                  {t("network.bindLocalhost")}
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t("network.tunnelName")}</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder={generateDefaultName(form, t)}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <p className="text-[0.6875rem]" style={{ color: "var(--df-text-dimmed)" }}>
                  {t("network.tunnelNameHint")}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
