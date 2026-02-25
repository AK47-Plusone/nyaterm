import type { IconType } from "react-icons";
import {
  SiAmazonwebservices,
  SiApple,
  SiCentos,
  SiDebian,
  SiDocker,
  SiFedora,
  SiGithub,
  SiGitlab,
  SiGo,
  SiGooglecloud,
  SiJavascript,
  SiKubernetes,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNginx,
  SiNodedotjs,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiRedis,
  SiRust,
  SiTypescript,
  SiUbuntu,
} from "react-icons/si";

export interface QuickIconDef {
  icon: IconType;
  color: string;
}

export const QUICK_ICONS: Record<string, QuickIconDef> = {
  docker: { icon: SiDocker, color: "#2496ed" },
  k8s: { icon: SiKubernetes, color: "#326ce5" },
  linux: { icon: SiLinux, color: "#FCC624" },
  ubuntu: { icon: SiUbuntu, color: "#E95420" },
  debian: { icon: SiDebian, color: "#A81D33" },
  centos: { icon: SiCentos, color: "#262577" },
  fedora: { icon: SiFedora, color: "#3C4FB1" },
  apple: { icon: SiApple, color: "#A2AAAD" },
  github: { icon: SiGithub, color: "#181717" },
  gitlab: { icon: SiGitlab, color: "#FC6D26" },
  nginx: { icon: SiNginx, color: "#009639" },
  redis: { icon: SiRedis, color: "#DC382D" },
  postgres: { icon: SiPostgresql, color: "#4169E1" },
  mysql: { icon: SiMysql, color: "#4479A1" },
  mongodb: { icon: SiMongodb, color: "#47A248" },
  python: { icon: SiPython, color: "#3776AB" },
  js: { icon: SiJavascript, color: "#F7DF1E" },
  ts: { icon: SiTypescript, color: "#3178C6" },
  rust: { icon: SiRust, color: "#000000" },
  go: { icon: SiGo, color: "#00ADD8" },
  node: { icon: SiNodedotjs, color: "#339933" },
  php: { icon: SiPhp, color: "#777BB4" },
  aws: { icon: SiAmazonwebservices, color: "#232F3E" },
  gcp: { icon: SiGooglecloud, color: "#4285F4" },
};

export type QuickIconName = keyof typeof QUICK_ICONS;
