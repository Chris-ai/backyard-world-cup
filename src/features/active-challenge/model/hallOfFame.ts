import type { ComponentType } from "react";
import { ArgentinaFlag, BrazilFlag, EnglandFlag, FranceFlag, GermanyFlag, ItalyFlag, NetherlandsFlag, PortugalFlag, SpainFlag, UruguayFlag } from "../../../shared/ui/country-flag/flags";
import type { FlagProps } from "../../../shared/ui/country-flag/flags/types";

export type ChoiceRole = "impostor" | "winner";
export type HallOfFameCountry = { code: string; flag: ComponentType<FlagProps>; name: string };

export const HALL_OF_FAME_COUNTRIES: HallOfFameCountry[] = [
  { code: "URU", name: "Urugwaj", flag: UruguayFlag },
  { code: "ITA", name: "Włochy", flag: ItalyFlag },
  { code: "GER", name: "Niemcy", flag: GermanyFlag },
  { code: "BRA", name: "Brazylia", flag: BrazilFlag },
  { code: "ENG", name: "Anglia", flag: EnglandFlag },
  { code: "ARG", name: "Argentyna", flag: ArgentinaFlag },
  { code: "FRA", name: "Francja", flag: FranceFlag },
  { code: "ESP", name: "Hiszpania", flag: SpainFlag },
  { code: "NED", name: "Holandia", flag: NetherlandsFlag },
  { code: "POR", name: "Portugalia", flag: PortugalFlag },
];

export function calculateHallOfFameScore(selections: Record<string, ChoiceRole>): number {
  return (selections.BRA === "winner" ? 3 : 0)
    + (selections.NED === "impostor" ? 1 : 0)
    + (selections.POR === "impostor" ? 1 : 0);
}
