import type { FlagProps } from "./types";

export function NetherlandsFlag(props: FlagProps) {
  return <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M30 0H0v20h30V0Z" fill="#F0F0F0"/><path d="M30 0H0v6.667h30V0Z" fill="#A2001D"/><path d="M30 13.333H0V20h30v-6.667Z" fill="#0052B4"/></svg>;
}
