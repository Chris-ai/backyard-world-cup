import { COUNTRIES } from "./countries";
import type { CountryCode } from "./countries";
import "./CountryFlag.css";

type CountryFlagProps = {
  country: CountryCode;
  size?: "small" | "large";
};

export function CountryFlag({ country, size = "small" }: CountryFlagProps) {
  const { flag: Flag } = COUNTRIES[country];

  return (
    <span className={`country-flag country-flag--${size}`} aria-hidden="true">
      <Flag focusable="false" />
    </span>
  );
}
