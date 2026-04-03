import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { MdExpandMore, MdSettings } from "react-icons/md";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { openSettings } from "@/lib/windowManager";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { SshKey } from "@/types/global";

interface SshFormProps {
  host: string;
  setHost: (v: string) => void;
  port: number;
  setPort: (v: number) => void;
  username: string;
  setUsername: (v: string) => void;
  authType: "password" | "key";
  setAuthType: (v: "password" | "key") => void;
  password: string;
  setPassword: (v: string) => void;
  keyId: string;
  setKeyId: (v: string) => void;
}

export function SshForm({ host, setHost, port, setPort, username, setUsername, authType, setAuthType, password, setPassword, keyId, setKeyId }: SshFormProps) {
  const { t } = useTranslation();
  const [sshKeys, setSshKeys] = useState<SshKey[]>([]);
  const [showKeyDropdown, setShowKeyDropdown] = useState(false);
  const keyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (keyRef.current && !keyRef.current.contains(e.target as Node)) {
        setShowKeyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let unlisten: () => void;
    getCurrentWindow()
      .onFocusChanged((event) => {
        if (event.payload) {
          invoke<SshKey[]>("get_ssh_keys").then(setSshKeys).catch(() => { });
        }
      })
      .then((fn) => { unlisten = fn; });
    invoke<SshKey[]>("get_ssh_keys").then(setSshKeys).catch(() => { });
    return () => { if (unlisten) unlisten(); };
  }, []);

  const selectedKeyName = sshKeys.find((k) => k.id === keyId)?.name;

  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className="text-[0.6875rem] text-muted-foreground">{t("dialog.host")}</Label>
          <Input className="mt-1 text-xs h-8" placeholder="192.168.1.100" value={host} onChange={(e) => setHost(e.target.value)} />
        </div>
        <div className="w-32">
          <Label className="text-[0.6875rem] text-muted-foreground">{t("dialog.port")}</Label>
          <NumberInput className="mt-1 [&_button]:h-8 [&_button]:w-8 [&_input]:h-8 [&_input]:text-xs" value={port} onChange={setPort} min={1} max={65535} />
        </div>
      </div>
      <div>
        <Label className="text-[0.6875rem] text-muted-foreground">{t("dialog.username")}</Label>
        <Input className="mt-1 text-xs h-8" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <Label className="text-[0.6875rem] text-muted-foreground">{t("dialog.authentication")}</Label>
        <Tabs value={authType} onValueChange={(v) => setAuthType(v as "password" | "key")} className="w-full mt-1">
          <TabsList className="grid w-full grid-cols-2 h-8 pointer-events-auto">
            <TabsTrigger value="password" className="text-xs">{t("dialog.password")}</TabsTrigger>
            <TabsTrigger value="key" className="text-xs">{t("dialog.privateKey")}</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-3 border-0 outline-none">
            <Label className="text-[0.6875rem] text-muted-foreground">{t("dialog.password")}</Label>
            <Input type="password" className="mt-1 text-xs h-8" value={password} onChange={(e) => setPassword(e.target.value)} />
          </TabsContent>

          <TabsContent value="key" className="mt-3 border-0 outline-none">
            <div className="relative" ref={keyRef}>
              <Label className="text-[0.6875rem] text-muted-foreground">{t("dialog.privateKey")}</Label>
              <Button type="button" variant="outline" className="w-full mt-1 h-8 justify-between text-xs font-normal" onClick={() => setShowKeyDropdown(!showKeyDropdown)}>
                <span className={`truncate ${keyId ? "" : "text-muted-foreground"}`}>{selectedKeyName || t("dialog.selectKey")}</span>
                <MdExpandMore className="text-xs text-muted-foreground shrink-0" />
              </Button>
              {showKeyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 border rounded-md shadow-xl z-20 overflow-hidden bg-popover flex flex-col max-h-36">
                  <div className="overflow-y-auto overflow-x-hidden flex-1">
                    <div className={`px-3 py-1.5 text-xs cursor-pointer transition-colors hover:bg-accent ${!keyId ? "bg-primary/15 text-primary" : "text-muted-foreground"}`} onClick={() => { setKeyId(""); setShowKeyDropdown(false); }}>{t("dialog.none")}</div>
                    {sshKeys.map((k) => (
                      <div key={k.id} className={`px-3 py-1.5 text-xs cursor-pointer transition-colors hover:bg-accent ${keyId === k.id ? "bg-primary/15 text-primary" : ""}`} onClick={() => { setKeyId(k.id); setShowKeyDropdown(false); }}>{k.name}</div>
                    ))}
                    {sshKeys.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">{t("dialog.noKeys")}</div>}
                  </div>
                  <div className="px-3 py-1.5 text-xs cursor-pointer transition-colors hover:bg-accent text-primary border-t flex items-center gap-1.5 shrink-0 bg-popover" onClick={() => { setShowKeyDropdown(false); openSettings("keyManagement"); }}>
                    <MdSettings className="text-sm" />{t("dialog.manageKeys")}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
