import type { CountryCode } from "../../../shared/ui/country-flag";

export const COUNTRY_INVITE_TOKENS: Record<CountryCode, string> = {
  usa: "ZXH2D7KJ20Ja-phQUditeXCx",
  mexico: "HTjKxx_EGxHczI3cTCmtwewP",
  canada: "aSgRYSSOp0qLhpJhah7cPSou",
  brazil: "I5WxNFzJ2TAyZBBwzJUMOiHH",
  argentina: "loB2LTyzkRuQ3ZO2ya5_zbZc",
  france: "huvr1cTscd4GyT1Q07of0aOY",
  spain: "FaLgv6bf6folsh5oc9Q_UMA_",
  portugal: "p9CNANyFK4wQvdoPrIFwyR7S",
  england: "2x6kCG4WdQtsoExfVwbTElkA",
  netherlands: "lqY0IAt8e-0QWC3iawOFHeiS",
  "cape-verde": "3Y3dOZ0WgHVb4IR_sy5hmdrD",
  curacao: "45iJ79Uzmb1f_EAQwQAIhJBT",
  belgium: "z1Z3DEJC1_B6lkwKpgjCgtM9",
};

export const ADMIN_INVITE_TOKEN = "qHce-nRByX1Kxlbo4o2h2L-3KrmYw_Fa";

export type InviteTarget =
  | { type: "admin" }
  | { type: "country"; country: CountryCode };

const countriesByInviteToken = new Map(
  Object.entries(COUNTRY_INVITE_TOKENS).map(([country, token]) => [token, country as CountryCode]),
);

export function resolveCountryFromInvite(token: string | null): CountryCode | null {
  if (!token) return null;
  return countriesByInviteToken.get(token) ?? null;
}

export function resolveInviteFromToken(token: string | null): InviteTarget | null {
  if (!token) return null;
  if (token === ADMIN_INVITE_TOKEN) return { type: "admin" };

  const country = resolveCountryFromInvite(token);
  return country ? { type: "country", country } : null;
}
