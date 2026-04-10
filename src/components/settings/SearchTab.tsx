import { useTranslation } from "react-i18next";
import { MdAdd, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { type QuickIconDef, SEARCH_ICONS } from "../icons";

export function SearchTab() {
  const { t } = useTranslation();
  const { appSettings, updateAppSettings } = useApp();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Label className="font-medium text-sm">{t("settings.customEngines")}</Label>
          <Button
            variant="ghost"
            size="xs"
            className="text-primary"
            onClick={() => {
              const newEngines = [
                ...appSettings.search.custom_engines,
                { name: "New Engine", url_template: "https://example.com/search?q=%s" },
              ];
              updateAppSettings({ search: { ...appSettings.search, custom_engines: newEngines } });
            }}
          >
            <MdAdd className="text-[0.875rem]" /> {t("common.add")}
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          {appSettings.search.custom_engines.map((engine, i) => (
            <div
              key={`${engine.name}-${engine.url_template}`}
              className="flex flex-col gap-2 border-b p-3 transition-colors last:border-0 hover:bg-accent sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-secondary"
                      title={t("settings.selectIcon")}
                    >
                      {engine.icon && SEARCH_ICONS[engine.icon] ? (
                        (() => {
                          const Icon = SEARCH_ICONS[engine.icon].icon;
                          return (
                            <Icon
                              className="text-base"
                              style={{ color: SEARCH_ICONS[engine.icon].color }}
                            />
                          );
                        })()
                      ) : (
                        <MdAdd className="text-sm text-muted-foreground" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="z-50 w-48 max-w-[calc(100vw-2rem)] p-2"
                  >
                    <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto terminal-scroll">
                      <DropdownMenuItem
                        className="flex cursor-pointer items-center justify-center rounded p-1 text-xs text-muted-foreground hover:bg-secondary"
                        onSelect={() => {
                          const newEngines = [...appSettings.search.custom_engines];
                          newEngines[i] = { ...newEngines[i], icon: undefined };
                          updateAppSettings({
                            search: { ...appSettings.search, custom_engines: newEngines },
                          });
                        }}
                        title="Clear icon"
                      >
                        ✕
                      </DropdownMenuItem>
                      {Object.entries(SEARCH_ICONS).map(([name, iconDef]) => {
                        const Icon = (iconDef as QuickIconDef).icon;
                        const color = (iconDef as QuickIconDef).color;
                        return (
                          <DropdownMenuItem
                            key={name}
                            className="flex cursor-pointer items-center justify-center rounded p-1 hover:bg-secondary"
                            onSelect={() => {
                              const newEngines = [...appSettings.search.custom_engines];
                              newEngines[i] = { ...newEngines[i], icon: name };
                              updateAppSettings({
                                search: { ...appSettings.search, custom_engines: newEngines },
                              });
                            }}
                            title={name}
                          >
                            <Icon className="text-base" style={{ color }} />
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10 sm:hidden"
                  title={t("common.delete")}
                  onClick={() => {
                    const newEngines = appSettings.search.custom_engines.filter(
                      (_, idx) => idx !== i,
                    );
                    updateAppSettings({
                      search: { ...appSettings.search, custom_engines: newEngines },
                    });
                  }}
                >
                  <MdDelete className="text-[1rem]" />
                </Button>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Name"
                  className="text-sm sm:w-40 sm:flex-none"
                  value={engine.name}
                  onChange={(e) => {
                    const newEngines = [...appSettings.search.custom_engines];
                    newEngines[i] = { ...newEngines[i], name: e.target.value };
                    updateAppSettings({
                      search: { ...appSettings.search, custom_engines: newEngines },
                    });
                  }}
                />
                <Input
                  placeholder="URL Template (e.g. https://google.com/search?q=%s)"
                  className="min-w-0 flex-1 text-sm"
                  value={engine.url_template}
                  onChange={(e) => {
                    const newEngines = [...appSettings.search.custom_engines];
                    newEngines[i] = { ...newEngines[i], url_template: e.target.value };
                    updateAppSettings({
                      search: { ...appSettings.search, custom_engines: newEngines },
                    });
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden text-destructive hover:bg-destructive/10 sm:inline-flex"
                title={t("common.delete")}
                onClick={() => {
                  const newEngines = appSettings.search.custom_engines.filter(
                    (_, idx) => idx !== i,
                  );
                  updateAppSettings({
                    search: { ...appSettings.search, custom_engines: newEngines },
                  });
                }}
              >
                <MdDelete className="text-[1rem]" />
              </Button>
            </div>
          ))}
          {appSettings.search.custom_engines.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              {t("settings.noCustomEngines")}
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("settings.engineUrl")}</p>
      </div>
    </div>
  );
}
