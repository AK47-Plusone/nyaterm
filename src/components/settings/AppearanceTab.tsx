import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAdd, MdClose } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { invoke } from "@/lib/invoke";
import {
  DEFAULT_TERMINAL_FONT_SIZE,
  MAX_TERMINAL_FONT_SIZE,
  MIN_TERMINAL_FONT_SIZE,
} from "@/lib/terminalFontSize";
import { themeList } from "@/lib/themes";
import {
  SettingFieldGrid,
  SettingNumberInput,
  SettingRow,
  SettingSection,
  SettingSelect,
  SettingSwitch,
} from "./SettingFormItems";

interface FontInfo {
  family: string;
  monospace: boolean;
}

const PACKAGE_FONT_INFOS: FontInfo[] = [
  { family: "JetBrains Mono", monospace: true },
  { family: "Noto Sans SC Variable", monospace: false },
  { family: "Inter", monospace: false },
];
const GENERIC_TERMINAL_FONTS = ["monospace"];
const UI_FALLBACK_FONT = "Inter";
const TERMINAL_FALLBACK_FONT = "JetBrains Mono";
const GENERIC_FONT_FAMILIES = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy"]);
const PACKAGE_FONTS = PACKAGE_FONT_INFOS.map((font) => font.family);
const PACKAGE_BUILT_IN_FONTS = new Set(PACKAGE_FONTS.map((font) => font.toLowerCase()));
const TERMINAL_BUILT_IN_FONTS = new Set(
  PACKAGE_FONT_INFOS.filter((font) => font.monospace).map((font) => font.family.toLowerCase()),
);

function splitFontStack(fontFamily: string) {
  return fontFamily
    .split(",")
    .map((font) => font.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function mergeFontFamilies(...fontLists: string[][]) {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const font of fontLists.flat()) {
    const normalized = font.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
  }
  return merged;
}

function previewFontFamily(font: string, fallback: "sans-serif" | "monospace") {
  if (GENERIC_FONT_FAMILIES.has(font.toLowerCase())) {
    return font;
  }
  return `"${font}", ${fallback}`;
}

interface FontStackSectionProps {
  title: string;
  desc: string;
  value: string;
  options: string[];
  builtInFonts: Set<string>;
  fallbackFont: string;
  previewFallback: "sans-serif" | "monospace";
  onChange: (value: string) => void;
}

function FontStackSection({
  title,
  desc,
  value,
  options,
  builtInFonts,
  fallbackFont,
  previewFallback,
  onChange,
}: FontStackSectionProps) {
  const { t } = useTranslation();
  const fonts = splitFontStack(value);

  return (
    <SettingSection
      title={title}
      desc={desc}
      action={
        <Button
          variant="ghost"
          size="xs"
          className="text-primary"
          onClick={() => {
            const nextFonts = [...fonts, options[0] || fallbackFont];
            onChange(nextFonts.join(", "));
          }}
        >
          <MdAdd className="text-[0.875rem]" />
          {t("settings.addFallbackFont")}
        </Button>
      }
      contentClassName="space-y-3"
    >
      {(fonts.length > 0 ? fonts : [fallbackFont]).map((font, idx, arr) => {
        const selectedFont = options.find((option) => option.toLowerCase() === font.toLowerCase());
        const selectValue = selectedFont ?? font;
        const isKnownFont = Boolean(selectedFont);

        return (
          <div
            key={`${font}-${idx === 0 ? "primary" : `fallback-${idx}`}`}
            className="rounded-lg border border-border/70 bg-background/70 p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 sm:w-32 sm:shrink-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {idx === 0 ? t("settings.fontPrimary") : `${t("settings.fontFallback")} ${idx}`}
                </p>
              </div>
              <Select
                value={selectValue}
                onValueChange={(nextFont) => {
                  const nextFonts = [...arr];
                  nextFonts[idx] = nextFont;
                  onChange(nextFonts.filter(Boolean).join(", "));
                }}
              >
                <SelectTrigger
                  className="h-9 min-w-0 w-full flex-1 px-3 text-sm shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
                  style={{ fontFamily: previewFontFamily(font, previewFallback) }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {!isKnownFont && (
                    <SelectItem
                      value={font}
                      disabled
                      style={{ fontFamily: previewFontFamily(font, previewFallback) }}
                    >
                      {font} (Custom/Missing)
                    </SelectItem>
                  )}
                  {options.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      style={{ fontFamily: previewFontFamily(option, previewFallback) }}
                    >
                      {option}{" "}
                      {builtInFonts.has(option.toLowerCase()) && `(${t("settings.fontBuiltIn")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-xs"
                className="self-end text-destructive hover:bg-destructive/10 sm:self-auto"
                title={t("common.remove")}
                onClick={() => {
                  const nextFonts = arr.filter((_, i) => i !== idx);
                  if (nextFonts.length === 0) nextFonts.push(fallbackFont);
                  onChange(nextFonts.join(", "));
                }}
              >
                <MdClose className="text-[1rem]" />
              </Button>
            </div>
          </div>
        );
      })}
    </SettingSection>
  );
}

export function AppearanceTab() {
  const { t } = useTranslation();
  const { appSettings, updateAppSettings } = useApp();
  const [systemFontInfos, setSystemFontInfos] = useState<FontInfo[]>([]);
  const applicationFonts = useMemo(
    () =>
      mergeFontFamilies(
        PACKAGE_FONTS,
        systemFontInfos.map((font) => font.family),
      ),
    [systemFontInfos],
  );
  const terminalFonts = useMemo(
    () =>
      mergeFontFamilies(
        PACKAGE_FONT_INFOS.filter((font) => font.monospace).map((font) => font.family),
        systemFontInfos.filter((font) => font.monospace).map((font) => font.family),
        GENERIC_TERMINAL_FONTS,
      ),
    [systemFontInfos],
  );

  useEffect(() => {
    invoke<FontInfo[]>("get_system_font_infos")
      .then((fonts) => setSystemFontInfos(fonts))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-5">
      <SettingSection contentClassName="space-y-5">
        <SettingSelect
          label={t("settings.theme")}
          desc={t("settings.themeDesc")}
          value={appSettings.appearance.theme || "github-dark"}
          onValueChange={(v) =>
            updateAppSettings({ appearance: { ...appSettings.appearance, theme: v } })
          }
        >
          {themeList.map((tm) => (
            <SelectItem key={tm.id} value={tm.id}>
              {tm.name}
            </SelectItem>
          ))}
        </SettingSelect>

        <SettingSelect
          label={t("settings.terminalTheme")}
          desc={t("settings.terminalThemeDesc")}
          value={appSettings.appearance.terminal_theme || "__follow__"}
          onValueChange={(v) =>
            updateAppSettings({
              appearance: {
                ...appSettings.appearance,
                terminal_theme: v === "__follow__" ? null : v,
              },
            })
          }
        >
          <SelectItem value="__follow__">{t("settings.followUiTheme")}</SelectItem>
          {themeList.map((tm) => (
            <SelectItem key={tm.id} value={tm.id}>
              {tm.name}
            </SelectItem>
          ))}
        </SettingSelect>
      </SettingSection>

      <FontStackSection
        title={t("settings.uiFontFamily")}
        desc={t("settings.uiFontFamilyDesc")}
        value={appSettings.appearance.ui_font_family}
        options={applicationFonts}
        builtInFonts={PACKAGE_BUILT_IN_FONTS}
        fallbackFont={UI_FALLBACK_FONT}
        previewFallback="sans-serif"
        onChange={(uiFontFamily) =>
          updateAppSettings({
            appearance: { ...appSettings.appearance, ui_font_family: uiFontFamily },
          })
        }
      />

      <FontStackSection
        title={t("settings.terminalFontFamily")}
        desc={t("settings.terminalFontFamilyDesc")}
        value={appSettings.appearance.font_family}
        options={terminalFonts}
        builtInFonts={TERMINAL_BUILT_IN_FONTS}
        fallbackFont={TERMINAL_FALLBACK_FONT}
        previewFallback="monospace"
        onChange={(terminalFontFamily) =>
          updateAppSettings({
            appearance: { ...appSettings.appearance, font_family: terminalFontFamily },
          })
        }
      />

      <SettingSection contentClassName="space-y-5">
        <SettingFieldGrid>
          <SettingNumberInput
            label={t("settings.fontSize")}
            min={MIN_TERMINAL_FONT_SIZE}
            max={MAX_TERMINAL_FONT_SIZE}
            value={appSettings.appearance.font_size}
            controlClassName="max-w-sm"
            onChange={(v) =>
              updateAppSettings({
                appearance: {
                  ...appSettings.appearance,
                  font_size: v || DEFAULT_TERMINAL_FONT_SIZE,
                },
              })
            }
          />
          <SettingNumberInput
            label={t("settings.uiFontSize")}
            min={12}
            max={24}
            value={appSettings.appearance.ui_font_size}
            controlClassName="max-w-sm"
            onChange={(v) =>
              updateAppSettings({
                appearance: { ...appSettings.appearance, ui_font_size: v || 16 },
              })
            }
          />
          <SettingSelect
            label={t("settings.cursorStyle")}
            value={appSettings.appearance.cursor_style}
            controlClassName="max-w-sm"
            onValueChange={(v) =>
              updateAppSettings({ appearance: { ...appSettings.appearance, cursor_style: v } })
            }
          >
            <SelectItem value="block">{t("settings.cursorBlock")}</SelectItem>
            <SelectItem value="underline">{t("settings.cursorUnderline")}</SelectItem>
            <SelectItem value="bar">{t("settings.cursorBar")}</SelectItem>
          </SettingSelect>
        </SettingFieldGrid>

        <SettingRow label={t("settings.cursorBlink")}>
          <SettingSwitch
            checked={appSettings.appearance.cursor_blink}
            onChange={(v) =>
              updateAppSettings({ appearance: { ...appSettings.appearance, cursor_blink: v } })
            }
          />
        </SettingRow>

        <SettingRow label={t("settings.fontLigatures")} desc={t("settings.fontLigaturesDesc")}>
          <SettingSwitch
            checked={appSettings.appearance.ligatures}
            onChange={(v) =>
              updateAppSettings({ appearance: { ...appSettings.appearance, ligatures: v } })
            }
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
