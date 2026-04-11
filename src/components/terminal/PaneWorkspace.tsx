import { memo, useRef } from "react";
import type { PaneNode, SplitPane, Tab } from "@/types/global";
import ResizeHandle from "@/components/layout/ResizeHandle";
import { isSplitPane } from "@/lib/workspaceTabs";
import XTerminal from "./XTerminal";

interface PaneWorkspaceProps {
  tab: Tab;
  visible: boolean;
  onActivatePane: (paneId: string) => void;
  onUpdateSplitRatio: (splitId: string, ratio: number) => void;
  onReconnected?: (oldSessionId: string, newSessionId: string) => void;
}

function SplitView({
  split,
  tab,
  visible,
  onActivatePane,
  onUpdateSplitRatio,
  onReconnected,
}: {
  split: SplitPane;
  tab: Tab;
  visible: boolean;
  onActivatePane: (paneId: string) => void;
  onUpdateSplitRatio: (splitId: string, ratio: number) => void;
  onReconnected?: (oldSessionId: string, newSessionId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHorizontalSplit = split.direction === "horizontal";

  const handleResize = (delta: number) => {
    const size = isHorizontalSplit
      ? containerRef.current?.clientHeight ?? 0
      : containerRef.current?.clientWidth ?? 0;
    if (size <= 0) return;
    onUpdateSplitRatio(split.id, split.ratio + delta / size);
  };

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full min-h-0 min-w-0 ${
        isHorizontalSplit ? "flex-col" : "flex-row"
      }`}
    >
      <div
        className="min-h-0 min-w-0 relative"
        style={{ flexBasis: `${split.ratio * 100}%`, flexGrow: 0, flexShrink: 0 }}
      >
        <PaneNodeView
          node={split.first}
          tab={tab}
          visible={visible}
          showChrome
          onActivatePane={onActivatePane}
          onUpdateSplitRatio={onUpdateSplitRatio}
          onReconnected={onReconnected}
        />
      </div>
      <ResizeHandle direction={isHorizontalSplit ? "vertical" : "horizontal"} onResize={handleResize} />
      <div
        className="min-h-0 min-w-0 flex-1 relative"
        style={{ flexBasis: `${(1 - split.ratio) * 100}%`, flexGrow: 1, flexShrink: 1 }}
      >
        <PaneNodeView
          node={split.second}
          tab={tab}
          visible={visible}
          showChrome
          onActivatePane={onActivatePane}
          onUpdateSplitRatio={onUpdateSplitRatio}
          onReconnected={onReconnected}
        />
      </div>
    </div>
  );
}

function PaneNodeView({
  node,
  tab,
  visible,
  showChrome,
  onActivatePane,
  onUpdateSplitRatio,
  onReconnected,
}: {
  node: PaneNode;
  tab: Tab;
  visible: boolean;
  showChrome: boolean;
  onActivatePane: (paneId: string) => void;
  onUpdateSplitRatio: (splitId: string, ratio: number) => void;
  onReconnected?: (oldSessionId: string, newSessionId: string) => void;
}) {
  if (isSplitPane(node)) {
    return (
      <SplitView
        split={node}
        tab={tab}
        visible={visible}
        onActivatePane={onActivatePane}
        onUpdateSplitRatio={onUpdateSplitRatio}
        onReconnected={onReconnected}
      />
    );
  }

  const isActive = visible && tab.activePaneId === node.id;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        showChrome ? "rounded-sm border" : ""
      } ${isActive ? "ring-1 ring-primary/60" : ""}`}
      style={{
        borderColor: showChrome ? "var(--df-border)" : undefined,
        backgroundColor: "var(--df-bg-terminal)",
      }}
      onMouseDown={() => onActivatePane(node.id)}
    >
      {node.connecting ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm"
          style={{ color: "var(--df-text-dimmed)" }}
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6 animate-spin"
            style={{ color: "var(--df-primary)" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="max-w-[16rem] truncate px-4 text-center">{node.name}</span>
        </div>
      ) : (
        <XTerminal
          sessionId={node.sessionId}
          active={isActive}
          visible={visible}
          connectionId={node.connectionId}
          onReconnected={onReconnected}
        />
      )}
    </div>
  );
}

function PaneWorkspace({
  tab,
  visible,
  onActivatePane,
  onUpdateSplitRatio,
  onReconnected,
}: PaneWorkspaceProps) {
  return (
    <div className="absolute inset-0" style={{ display: visible ? "block" : "none" }}>
      <PaneNodeView
        node={tab.root}
        tab={tab}
        visible={visible}
        showChrome={isSplitPane(tab.root)}
        onActivatePane={onActivatePane}
        onUpdateSplitRatio={onUpdateSplitRatio}
        onReconnected={onReconnected}
      />
    </div>
  );
}

export default memo(PaneWorkspace);
