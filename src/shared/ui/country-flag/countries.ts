import type { ComponentType } from "react";
import {
  ArgentinaFlag,
  BelgiumFlag,
  BrazilFlag,
  CanadaFlag,
  CapeVerdeFlag,
  CuracaoFlag,
  EnglandFlag,
  FranceFlag,
  MexicoFlag,
  NetherlandsFlag,
  PortugalFlag,
  SpainFlag,
  UsaFlag,
} from "./flags";
import type { FlagProps } from "./flags/types";

export type CountryCode =
  | "argentina"
  | "belgium"
  | "brazil"
  | "canada"
  | "cape-verde"
  | "curacao"
  | "england"
  | "france"
  | "mexico"
  | "netherlands"
  | "portugal"
  | "spain"
  | "usa";

export type CountryDefinition = {
  code: CountryCode;
  fifaCode: string;
  flag: ComponentType<FlagProps>;
  isoCode: string;
  nameEn: string;
  namePl: string;
  welcomeNamePl: string;
};

export const COUNTRIES: Record<CountryCode, CountryDefinition> = {
  usa: { code: "usa", fifaCode: "USA", isoCode: "US", namePl: "USA", nameEn: "United States", welcomeNamePl: "USA", flag: UsaFlag },
  mexico: { code: "mexico", fifaCode: "MEX", isoCode: "MX", namePl: "Meksyk", nameEn: "Mexico", welcomeNamePl: "Meksyku", flag: MexicoFlag },
  canada: { code: "canada", fifaCode: "CAN", isoCode: "CA", namePl: "Kanada", nameEn: "Canada", welcomeNamePl: "Kanady", flag: CanadaFlag },
  brazil: { code: "brazil", fifaCode: "BRA", isoCode: "BR", namePl: "Brazylia", nameEn: "Brazil", welcomeNamePl: "Brazylii", flag: BrazilFlag },
  argentina: { code: "argentina", fifaCode: "ARG", isoCode: "AR", namePl: "Argentyna", nameEn: "Argentina", welcomeNamePl: "Argentyny", flag: ArgentinaFlag },
  france: { code: "france", fifaCode: "FRA", isoCode: "FR", namePl: "Francja", nameEn: "France", welcomeNamePl: "Francji", flag: FranceFlag },
  spain: { code: "spain", fifaCode: "ESP", isoCode: "ES", namePl: "Hiszpania", nameEn: "Spain", welcomeNamePl: "Hiszpanii", flag: SpainFlag },
  portugal: { code: "portugal", fifaCode: "POR", isoCode: "PT", namePl: "Portugalia", nameEn: "Portugal", welcomeNamePl: "Portugalii", flag: PortugalFlag },
  england: { code: "england", fifaCode: "ENG", isoCode: "GB-ENG", namePl: "Anglia", nameEn: "England", welcomeNamePl: "Anglii", flag: EnglandFlag },
  netherlands: { code: "netherlands", fifaCode: "NED", isoCode: "NL", namePl: "Holandia", nameEn: "Netherlands", welcomeNamePl: "Holandii", flag: NetherlandsFlag },
  "cape-verde": { code: "cape-verde", fifaCode: "CPV", isoCode: "CV", namePl: "Republika Zielonego Przylądka", nameEn: "Cape Verde", welcomeNamePl: "Republiki Zielonego Przylądka", flag: CapeVerdeFlag },
  curacao: { code: "curacao", fifaCode: "CUW", isoCode: "CW", namePl: "Curaçao", nameEn: "Curaçao", welcomeNamePl: "Curaçao", flag: CuracaoFlag },
  belgium: { code: "belgium", fifaCode: "BEL", isoCode: "BE", namePl: "Belgia", nameEn: "Belgium", welcomeNamePl: "Belgii", flag: BelgiumFlag },
};

export const AVAILABLE_COUNTRIES = Object.values(COUNTRIES);

export function isCountryCode(value: string): value is CountryCode {
  return value in COUNTRIES;
}
