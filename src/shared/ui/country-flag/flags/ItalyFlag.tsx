import type { FlagProps } from "./types";

export function ItalyFlag(props: FlagProps) {
  return <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" {...props}><path fill="#F0F0F0" d="M0 0h30v20H0z"/><path fill="#009246" d="M0 0h10v20H0z"/><path fill="#CE2B37" d="M20 0h10v20H20z"/></svg>;
}
