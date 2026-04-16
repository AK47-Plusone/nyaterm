import type { IMarker, Terminal } from "@xterm/xterm";
import { useRef } from "react";
import { sanitizeTerminalCommand } from "@/lib/terminalCommand";

export interface ShellIntegrationState {
  enabled: boolean;
  promptStartMarker: IMarker | null;
  commandStartMarker: IMarker | null;
  commandStartX: number;
  fallbackPromptEndX: number;
  fallbackNeedsDetection: boolean;
}

export function useShellIntegration(
  terminalRef: React.RefObject<Terminal | null>,
  currentLineRef: React.RefObject<string>,
) {
  const shellIntegrationRef = useRef<ShellIntegrationState>({
    enabled: false,
    promptStartMarker: null,
    commandStartMarker: null,
    commandStartX: 0,
    fallbackPromptEndX: 0,
    fallbackNeedsDetection: true,
  });

  const readBetweenMarkerAndCursor = (
    terminal: Terminal,
    startMarker: IMarker,
    startX: number,
  ): string => {
    try {
      const buf = terminal.buffer.active;
      const startRow = startMarker.line;
      const endRow = buf.baseY + buf.cursorY;

      if (startRow === endRow) {
        const line = buf.getLine(startRow);
        return line?.translateToString(true, startX) ?? "";
      }

      let result = "";
      for (let row = startRow; row <= endRow; row++) {
        const line = buf.getLine(row);
        if (!line) continue;
        if (row === startRow) {
          result += line.translateToString(true, startX);
        } else if (line.isWrapped) {
          result += line.translateToString(true);
        } else {
          result += `\n${line.translateToString(true)}`;
        }
      }
      return result;
    } catch {
      return "";
    }
  };

  const readCommandFromBuffer = (): string => {
    const terminal = terminalRef.current;
    if (!terminal) return sanitizeTerminalCommand(currentLineRef.current);
    const si = shellIntegrationRef.current;

    try {
      if (si.enabled && si.commandStartMarker) {
        return sanitizeTerminalCommand(
          readBetweenMarkerAndCursor(terminal, si.commandStartMarker, si.commandStartX),
        );
      }

      const buf = terminal.buffer.active;
      const row = buf.baseY + buf.cursorY;
      const line = buf.getLine(row);
      if (!line) return sanitizeTerminalCommand(currentLineRef.current);
      return sanitizeTerminalCommand(line.translateToString(true, si.fallbackPromptEndX));
    } catch {
      return sanitizeTerminalCommand(currentLineRef.current);
    }
  };

  return {
    shellIntegrationRef,
    readCommandFromBuffer,
    readBetweenMarkerAndCursor,
  };
}
