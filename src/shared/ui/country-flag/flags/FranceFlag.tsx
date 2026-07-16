import type { FlagProps } from "./types";

export function FranceFlag(props: FlagProps) {
  return <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M30 0H0v20h30V0Z" fill="#F0F0F0"/><path d="M10 0H0v20h10V0Z" fill="#0052B4"/><path d="M30 0H20v20h10V0Z" fill="#D80027"/></svg>;
}
