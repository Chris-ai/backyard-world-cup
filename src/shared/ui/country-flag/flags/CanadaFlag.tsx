import type { FlagProps } from "./types";

export function CanadaFlag(props: FlagProps) {
  return <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M30 0H0v20h30V0Z" fill="#F0F0F0"/><path d="M10 0H0v20h10V0ZM30 0H20v20h10V0Z" fill="#D80027"/><path d="m16.875 11.389 1.875-.938-.938-.468v-.938l-1.874.938.937-1.875h-.938L15 6.7l-.938 1.407h-.937l.938 1.875-1.876-.938v.938l-.937.468 1.875.938-.469.937h1.875v1.407h.938v-1.407h1.875l-.469-.937Z" fill="#D80027"/></svg>;
}
