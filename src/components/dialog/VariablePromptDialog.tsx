import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "../../context/AppContext";

export interface VariableDef {
  raw: string;
  name: string;
  options?: string[];
  defaultValue?: string;
  isSystem: boolean;
}

interface VariablePromptDialogProps {
  open: boolean;
  command: string;
  variables: VariableDef[];
  onCancel: () => void;
  onSubmit: (resolvedCommand: string) => void;
}

export default function VariablePromptDialog({
  open,
  command,
  variables,
  onCancel,
  onSubmit,
}: VariablePromptDialogProps) {
  const { t } = useTranslation();
  const { tabs, activeTabId } = useApp();

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};

      const activeTab = tabs.find((t) => t.id === activeTabId);

      variables.forEach((v) => {
        if (v.isSystem) {
          if (v.name === "DATE") {
            const now = new Date();
            initial[v.name] = now.toISOString().split("T")[0];
          } else if (v.name === "TIME") {
            const now = new Date();
            initial[v.name] = now.toTimeString().split(" ")[0];
          } else if (v.name === "TIMESTAMP") {
            initial[v.name] = Date.now().toString();
          } else if (v.name === "CURRENT_USER") {
            initial[v.name] = (window as any).__TAURI__ ? "..." : "user"; // Maybe we can fetch real user, but for now placeholder
          } else if (v.name === "CONNECTION_IP" && activeTab) {
            // we don't have direct access to IP in Tab interface easily, but we can put placeholder
            initial[v.name] = "127.0.0.1";
          } else {
            initial[v.name] = "";
          }
        } else {
          initial[v.name] =
            v.defaultValue || (v.options && v.options.length > 0 ? v.options[0] : "");
        }
      });
      setValues(initial);
    }
  }, [open, variables, tabs, activeTabId]);

  const handleSubmit = () => {
    let finalCmd = command;
    variables.forEach((v) => {
      // Replace all occurrences of this specific variable's raw string
      finalCmd = finalCmd.split(v.raw).join(values[v.name] || "");
    });
    onSubmit(finalCmd);
  };

  const userVars = variables.filter((v) => !v.isSystem);

  // If there are no user variables, we can actually auto-submit,
  // but usually this dialog shouldn't even open if so.
  // Handled by the caller.

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent aria-describedby={undefined} className="w-[400px] sm:max-w-[400px] p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b">
          <DialogTitle className="text-sm">
            {t("quickCommands.fillVariables") || "Fill Command Variables"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {userVars.map((v) => (
            <div key={v.name}>
              <Label className="text-[11px] text-muted-foreground">{v.name}</Label>
              {v.options && v.options.length > 0 ? (
                <Select
                  value={values[v.name] || ""}
                  onValueChange={(val) => setValues({ ...values, [v.name]: val })}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {v.options.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="mt-1 text-xs h-8"
                  value={values[v.name] || ""}
                  onChange={(e) => setValues({ ...values, [v.name]: e.target.value })}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                />
              )}
            </div>
          ))}

          <div className="bg-muted/50 p-2 rounded relative mt-4">
            <Label className="text-[10px] text-muted-foreground absolute -top-2 left-2 px-1 bg-popover">
              Preview
            </Label>
            <div className="text-[11px] font-mono break-all text-muted-foreground mt-2">
              {(() => {
                let preview = command;
                variables.forEach((v) => {
                  preview = preview.split(v.raw).join(values[v.name] || "");
                });
                return preview || <span className="opacity-50">Empty command</span>;
              })()}
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t">
          <Button variant="ghost" size="sm" className="text-xs" onClick={onCancel}>
            {t("dialog.cancel")}
          </Button>
          <Button size="sm" className="text-xs" onClick={handleSubmit}>
            {t("quickCommands.run") || "Run Command"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility function to parse command
export function parseCommandVariables(command: string): VariableDef[] {
  const regex = /\$\{([^}]+)\}/g;
  const matches = [...command.matchAll(regex)];

  const SYSTEM_VARS = ["DATE", "TIME", "TIMESTAMP", "CURRENT_USER", "CONNECTION_IP"];

  const vars: VariableDef[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const raw = match[0];
    const content = match[1];

    if (seen.has(raw)) continue;
    seen.add(raw);

    const isSystem = SYSTEM_VARS.includes(content);

    if (isSystem) {
      vars.push({ raw, name: content, isSystem: true });
      continue;
    }

    // Try parsing enum | value1,value2
    if (content.includes("|")) {
      const [name, optsStr] = content.split("|");
      const options = optsStr.split(",").map((s) => s.trim());
      vars.push({ raw, name: name.trim(), options, isSystem: false });
    }
    // Try parsing default =value
    else if (content.includes("=")) {
      const [name, defaultVal] = content.split("=");
      vars.push({ raw, name: name.trim(), defaultValue: defaultVal.trim(), isSystem: false });
    }
    // Normal var
    else {
      vars.push({ raw, name: content.trim(), isSystem: false });
    }
  }

  return vars;
}
