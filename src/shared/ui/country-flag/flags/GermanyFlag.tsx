import type { FlagProps } from "./types";

export function GermanyFlag(props: FlagProps) {
  return <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" {...props}><path fill="#151515" d="M0 0h30v6.667H0z"/><path fill="#D80027" d="M0 6.667h30v6.666H0z"/><path fill="#FFDA44" d="M0 13.333h30V20H0z"/></svg>;
}
