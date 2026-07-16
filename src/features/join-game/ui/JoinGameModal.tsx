import { useState } from "react";
import type { FormEvent } from "react";
import { COUNTRIES, CountryFlag } from "../../../shared/ui/country-flag";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { Modal } from "../../../shared/ui/modal";
import "./JoinGameModal.css";

type JoinGameModalProps = {
  country: CountryCode;
  isOpen: boolean;
  onJoin: (playerName: string) => Promise<void>;
};

export function JoinGameModal({ country, isOpen, onJoin }: JoinGameModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const countryDetails = COUNTRIES[country];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const playerName = name.trim();

    if (!playerName) {
      setError("Wpisz swoje imię, aby dołączyć do gry.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onJoin(playerName);
    } catch (joinError) {
      const message = joinError instanceof Error
        ? joinError.message
        : "Nie udało się dołączyć do gry. Spróbuj ponownie.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      titleId="join-title"
      descriptionId="join-description"
      className="join-modal"
    >
      <div className="join-modal__content">
        <div className="flag-wrap">
          <div className="flag-badge"><CountryFlag country={country} size="large" /></div>
          <span className="team-tag">YOUR TEAM</span>
        </div>

        <p className="welcome-label">WELCOME TO THE CUP</p>
        <h2 id="join-title">Witaj w drużynie<br /><em>{countryDetails.welcomeNamePl}!</em></h2>
        <p id="join-description" className="modal-description">
          Jesteś o krok od wejścia do gry. Powiedz nam, jak masz na imię.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="player-name">TWOJE IMIĘ</label>
          <div className={`input-wrap ${error ? "input-error" : ""}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5.5 20c.5-4.1 2.7-6.2 6.5-6.2s6 2.1 6.5 6.2" />
            </svg>
            <input
              id="player-name"
              name="playerName"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError("");
              }}
              placeholder="np. Michał"
              autoComplete="given-name"
              autoFocus
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "name-error" : undefined}
            />
          </div>
          {error && <p className="error-message" id="name-error" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "DOŁĄCZAM..." : "DOŁĄCZ DO GRY"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="privacy-note">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="10" width="12" height="10" rx="2" />
            <path d="M9 10V7a3 3 0 0 1 6 0v3" />
          </svg>
          Twoje imię będzie widoczne tylko dla uczestników gry
        </p>
      </div>
    </Modal>
  );
}
