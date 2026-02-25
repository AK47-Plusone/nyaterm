import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAdd } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { QuickCommand } from "../../types";
import { QUICK_ICONS } from "../icons";

interface EditQuickCommandDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (cmd: QuickCommand) => void;
  initialData?: QuickCommand | null;
}

const THEME_COLORS = ["default", "red", "green", "blue", "yellow", "purple"];
const COLOR_CLASSES: Record<string, string> = {
  default: "bg-secondary",
  red: "bg-red-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  yellow: "bg-yellow-400",
  purple: "bg-purple-400",
};

export default function EditQuickCommandDialog({
  open,
  onClose,
  onSave,
  initialData,
}: EditQuickCommandDialogProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [command, setCommand] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [colorTag, setColorTag] = useState("default");
  const [iconTag, setIconTag] = useState<string | undefined>(undefined);
  const [pinned, setPinned] = useState(false);
  const [executionMode, setExecutionMode] = useState("execute");

  const [errors, setErrors] = useState<{ label?: string; command?: string; general?: string }>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        setLabel(initialData.label || "");
        setCommand(initialData.command || "");
        setCategory(initialData.category || "");
        setDescription(initialData.description || "");
        setColorTag(initialData.color_tag || "default");
        setIconTag(initialData.icon_tag);
        setPinned(initialData.pinned || false);
        setExecutionMode(initialData.execution_mode || "execute");
      } else {
        setLabel("");
        setCommand("");
        setCategory("");
        setDescription("");
        setColorTag("default");
        setIconTag(undefined);
        setPinned(false);
        setExecutionMode("execute");
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleSave = () => {
    const newErrors: { label?: string; command?: string } = {};
    if (!label.trim()) {
      newErrors.label = t("quickCommands.errorLabelRequired") || "Label is required";
    }
    if (!command.trim()) {
      newErrors.command = t("quickCommands.errorCommandRequired") || "Command script is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: initialData?.id || `qc-${Date.now()}`,
      label: label.trim(),
      command: command.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      color_tag: colorTag === "default" && !iconTag ? undefined : colorTag,
      icon_tag: iconTag,
      pinned,
      execution_mode: executionMode,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent aria-describedby={undefined} className="w-[500px] sm:max-w-[500px] p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="text-base">
            {initialData
              ? t("quickCommands.editCommand") || "Edit Quick Command"
              : t("quickCommands.addCommand") || "Add Quick Command"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto terminal-scroll">
          {/* Label + Category */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="qc-label" className="text-xs text-muted-foreground">
                {t("quickCommands.labelName") || "Label"}
              </Label>
              <Input
                id="qc-label"
                className={`text-sm h-9 ${errors.label ? "border-destructive" : ""}`}
                placeholder={t("quickCommands.labelPlaceholder") || "e.g. List files"}
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setErrors((p) => ({ ...p, label: undefined }));
                }}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="qc-category" className="text-xs text-muted-foreground">
                {t("quickCommands.category") || "Category"}
              </Label>
              <Input
                id="qc-category"
                className="text-sm h-9"
                placeholder={t("quickCommands.categoryPlaceholder") || "e.g. K8s"}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="qc-desc" className="text-xs text-muted-foreground">
              {t("quickCommands.description") || "Description (optional)"}
            </Label>
            <Input
              id="qc-desc"
              className="text-sm h-9"
              placeholder={
                t("quickCommands.descriptionPlaceholder") || "Details about this command"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Color Tag & Pinned */}
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("quickCommands.colorTag") || "Color Tag"}
              </Label>
              <div className="flex gap-2 h-9 items-center">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setColorTag(color);
                      setIconTag(undefined);
                    }}
                    className={`w-6 h-6 rounded-full border-2 focus:outline-none transition-all ${
                      colorTag === color && !iconTag
                        ? "border-foreground scale-110 shadow-sm"
                        : "border-transparent hover:scale-105"
                    } ${COLOR_CLASSES[color]}`}
                    title={color}
                  />
                ))}

                {/* Icon selected state */}
                {iconTag && QUICK_ICONS[iconTag] && (
                  <div className="w-6 h-6 rounded-full border-2 border-foreground scale-110 shadow-sm flex items-center justify-center bg-secondary">
                    {(() => {
                      const iconDef = QUICK_ICONS[iconTag];
                      return <iconDef.icon className="text-sm" style={{ color: iconDef.color }} />;
                    })()}
                  </div>
                )}

                {/* Add Icon Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/50 hover:border-foreground flex items-center justify-center transition-all hover:scale-110"
                      title={t("quickCommands.selectIcon")}
                    >
                      <MdAdd className="text-sm" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="p-2 w-48">
                    <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto terminal-scroll">
                      {Object.entries(QUICK_ICONS).map(([name, iconDef]) => (
                        <DropdownMenuItem
                          key={name}
                          className="p-1 cursor-pointer flex items-center justify-center hover:bg-secondary rounded"
                          onSelect={() => {
                            setIconTag(name);
                            setColorTag("default");
                          }}
                        >
                          <iconDef.icon className="text-base" style={{ color: iconDef.color }} />
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-2 h-9">
              <Switch checked={pinned} onCheckedChange={setPinned} id="qc-pinned" />
              <Label htmlFor="qc-pinned" className="text-sm cursor-pointer">
                {t("quickCommands.pin") || "Pin to top"}
              </Label>
            </div>
          </div>

          {/* Execution Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("quickCommands.executionMode") || "Execution Mode"}
            </Label>
            <div className="flex p-1 gap-1 bg-muted/40 rounded-md border items-center">
              <Button
                type="button"
                variant={executionMode === "execute" ? "secondary" : "ghost"}
                size="sm"
                className={`flex-1 text-sm h-8 ${executionMode === "execute" ? "shadow-sm" : ""}`}
                onClick={() => setExecutionMode("execute")}
              >
                {t("quickCommands.executeImmediately") || "Execute immediately"}
              </Button>
              <Button
                type="button"
                variant={executionMode === "append" ? "secondary" : "ghost"}
                size="sm"
                className={`flex-1 text-sm h-8 ${executionMode === "append" ? "shadow-sm" : ""}`}
                onClick={() => setExecutionMode("append")}
              >
                {t("quickCommands.appendOnly") || "Append to prompt"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground pl-1">
              {executionMode === "execute"
                ? t("quickCommands.executeHint") ||
                  "Command will be executed automatically when clicked."
                : t("quickCommands.appendHint") ||
                  "Command will be placed at the prompt for review before executing."}
            </p>
          </div>

          {/* Script / Command */}
          <div className="space-y-1.5">
            <Label htmlFor="qc-command" className="text-xs text-muted-foreground">
              {t("quickCommands.commandScript") || "Command Script"}
            </Label>
            <Textarea
              id="qc-command"
              className={`font-mono text-sm resize-none h-28 ${errors.command ? "border-destructive" : ""}`}
              style={{ fieldSizing: "fixed" } as any}
              placeholder={
                t("quickCommands.commandPlaceholder") ||
                "e.g. ls -la\nUse ${varName} for variables."
              }
              value={command}
              onChange={(e) => {
                setCommand(e.target.value);
                setErrors((p) => ({ ...p, command: undefined }));
              }}
            />
          </div>

          {(errors.label || errors.command || errors.general) && (
            <div className="text-sm text-red-500 bg-red-500/10 p-2.5 rounded border border-red-500/30">
              {errors.label && <div>{errors.label}</div>}
              {errors.command && <div>{errors.command}</div>}
              {errors.general && <div>{errors.general}</div>}
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-4 border-t bg-muted/20">
          <Button variant="ghost" size="sm" className="text-sm h-9 px-4" onClick={onClose}>
            {t("dialog.cancel")}
          </Button>
          <Button size="sm" className="text-sm h-9 px-4" onClick={handleSave}>
            {t("dialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
