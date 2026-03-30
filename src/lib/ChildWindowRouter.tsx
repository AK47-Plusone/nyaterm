import { lazy, Suspense, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";

const SettingsPage = lazy(() => import("../pages/SettingsPage"));
const NewSessionPage = lazy(() => import("../pages/NewSessionPage"));
const QuickCommandPage = lazy(() => import("../pages/QuickCommandPage"));

const PAGES: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
  settings: SettingsPage,
  "new-session": NewSessionPage,
  "quick-command": QuickCommandPage,
};

export default function ChildWindowRouter({ windowType }: { windowType: string }) {
  const { t } = useTranslation();
  const Page = PAGES[windowType];

  useEffect(() => {
    getCurrentWindow().show().catch(() => { });
  }, []);

  if (!Page) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        {t("common.unknownWindowType")}: {windowType}
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center text-muted-foreground text-sm">
          {t("common.loading")}
        </div>
      }
    >
      <Page />
    </Suspense>
  );
}
