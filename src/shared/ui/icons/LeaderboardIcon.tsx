import type { SVGProps } from "react";

export function LeaderboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 20v-6h4v6H5Zm5 0V8h4v12h-4Zm5 0V3h4v17h-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
