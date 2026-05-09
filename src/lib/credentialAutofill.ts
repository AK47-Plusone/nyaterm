import type { SavedCredential } from "@/types/global";

export type CredentialPromptKind = "username" | "password";

const ANSI_PATTERN =
  /[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g;
const OSC_PATTERN = /\u001b\][\s\S]*?(?:\u0007|\u001b\\)/g;

export function stripTerminalControlSequences(text: string): string {
  return text.replace(OSC_PATTERN, "").replace(ANSI_PATTERN, "");
}

export function compilePromptRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "im");
  } catch {
    return null;
  }
}

export function getCredentialPromptPattern(
  credential: SavedCredential,
  kind: CredentialPromptKind,
): string {
  const custom =
    kind === "username" ? credential.username_prompt_regex : credential.password_prompt_regex;
  return custom?.trim() ?? "";
}

export function credentialMatchesPrompt(
  credential: SavedCredential,
  kind: CredentialPromptKind,
  output: string,
): boolean {
  if (!credential.enabled) return false;
  if (kind === "username" && !credential.username.trim()) return false;
  if (kind === "password" && !credential.has_password) return false;

  const pattern = getCredentialPromptPattern(credential, kind);
  if (!pattern) return false;
  const regex = compilePromptRegex(pattern);
  if (!regex) return false;
  return regex.test(output);
}

export function findMatchingCredentials(
  credentials: SavedCredential[],
  kind: CredentialPromptKind,
  output: string,
): SavedCredential[] {
  return credentials.filter((credential) => credentialMatchesPrompt(credential, kind, output));
}

export function validatePromptRegex(pattern: string): boolean {
  const trimmed = pattern.trim();
  return Boolean(trimmed && compilePromptRegex(trimmed));
}
