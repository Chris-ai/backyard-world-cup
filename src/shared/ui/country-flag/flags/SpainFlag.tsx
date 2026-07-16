import type { FlagProps } from "./types";

export function SpainFlag(props: FlagProps) {
  return <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M30 0H0v20h30V0Z" fill="#FFDA44"/><path d="M30 0H0v6.666h30V0ZM30 13.333H0V20h30v-6.667Z" fill="#D80027"/></svg>;
}
