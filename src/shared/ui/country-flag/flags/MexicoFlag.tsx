import type { FlagProps } from "./types";

export function MexicoFlag(props: FlagProps) {
  return <svg viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M0 0h30v20H0z" fill="#D80027"/><path d="M10 0H0v20h10V0Z" fill="#6DA544"/><path d="M20 0H10v20h10V0Z" fill="#F0F0F0"/><path d="M12.188 10A2.812 2.812 0 0 0 15 12.812 2.812 2.812 0 0 0 17.813 10v-.938h-5.625V10Z" fill="#6DA544"/><path d="M18.75 8.125h-2.813a.937.937 0 0 0-1.874 0H11.25c0 .518.451.937.969.937h-.032c0 .518.42.938.938.938 0 .517.42.937.938.937h1.874a.937.937 0 0 0 .938-.937c.518 0 .938-.42.938-.938h-.032c.518 0 .969-.42.969-.937Z" fill="#FF9811"/></svg>;
}
