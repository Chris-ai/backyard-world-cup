import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getActiveOnlineChallenges, getFinalBet } from "../api";
import type { ActiveChallenge, FinalBet } from "../api";
import { supabase } from "../../../utils/supabase";
import { DocumentLinearIcon } from "../../../shared/ui/icons";
import { FinalBetChallenge } from "./FinalBetChallenge";
import { HallOfFameChallenge } from "./HallOfFameChallenge";
import { HostQuizChallenge } from "./HostQuizChallenge";
import "./ActiveChallengeDrawer.css";

type ActiveChallengeDrawerProps = {
  playerToken: string;
};

export function ActiveChallengeDrawer({ playerToken }: ActiveChallengeDrawerProps) {
  const [challenges, setChallenges] = useState<ActiveChallenge[]>([]);
  const [finalBet, setFinalBet] = useState<FinalBet | null | undefined>(undefined);
  const [isBetDrawerOpen, setIsBetDrawerOpen] = useState(true);

  const refreshChallenges = useCallback(async () => {
    try {
      setChallenges(await getActiveOnlineChallenges());
    } catch {
      // Ranking pozostaje dostępny, gdy odczyt aktywnej konkurencji chwilowo zawiedzie.
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshChallenges(), 0);
    const fallbackRefresh = window.setInterval(() => void refreshChallenges(), 2000);
    const channel = supabase
      .channel("active-online-challenges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges" },
        () => void refreshChallenges(),
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(fallbackRefresh);
      void supabase.removeChannel(channel);
    };
  }, [refreshChallenges]);

  const activeChallenge = challenges[0];
  const normalizedChallengeName = activeChallenge?.name.toLocaleLowerCase("pl");
  const isHallOfFame = normalizedChallengeName === "galeria sław";
  const isGrandeFinale = normalizedChallengeName === "grande finale";
  const isHostQuiz = normalizedChallengeName === "kto zna host";
  const activeChallengeId = activeChallenge?.id;
  const activeChallengeStatus = activeChallenge?.status;

  useEffect(() => {
    if (!activeChallengeId || activeChallengeStatus !== "pending" || !isGrandeFinale) {
      return;
    }

    let isActive = true;
    getFinalBet(playerToken)
      .then((bet) => {
        if (!isActive) return;
        setFinalBet(bet);
        setIsBetDrawerOpen(!bet);
      })
      .catch(() => {
        if (isActive) {
          setFinalBet(null);
          setIsBetDrawerOpen(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [activeChallengeId, activeChallengeStatus, isGrandeFinale, playerToken]);

  if (!activeChallenge) return null;

  if (activeChallenge.status === "pending" && isGrandeFinale && finalBet && !isBetDrawerOpen) {
    const navbarActions = document.getElementById("leaderboard-navbar-actions");
    const reopenButton = (
      <button className="reopen-bet-button" type="button" onClick={() => setIsBetDrawerOpen(true)} aria-label="Pokaż mój bet finału">
        <DocumentLinearIcon />
      </button>
    );

    return navbarActions ? createPortal(reopenButton, navbarActions) : null;
  }

  return (
    <section
      className="challenge-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="active-challenge-title"
      aria-describedby="active-challenge-description"
    >
      {activeChallenge.status === "open" ? (
        <>
          <div className="challenge-drawer__shape" aria-hidden="true" />
          <div className="challenge-drawer__content">
            <p className="challenge-drawer__eyebrow">AKTYWNE WYZWANIE</p>
            <span className="challenge-drawer__order">
              {String(activeChallenge.sortOrder).padStart(2, "0")}
            </span>
            <h2 id="active-challenge-title">{activeChallenge.name}</h2>
            <p id="active-challenge-description">
              Przygotuj się. Za chwilę rozpoczniemy wyzwanie.
            </p>
            {challenges.length > 1 && (
              <small>{challenges.length - 1} kolejnych wyzwań czeka w kolejce</small>
            )}
          </div>
        </>
      ) : isHallOfFame ? (
        <HallOfFameChallenge
          challengeId={activeChallenge.id}
          maxPoints={activeChallenge.maxPoints}
          playerToken={playerToken}
        />
      ) : isGrandeFinale ? (
        finalBet === undefined ? (
          <div className="challenge-result-loading" aria-label="Ładowanie beta" />
        ) : (
          <FinalBetChallenge
            initialBet={finalBet}
            onClose={finalBet ? () => setIsBetDrawerOpen(false) : undefined}
            playerToken={playerToken}
            onSaved={(savedBet) => {
              setFinalBet(savedBet);
              setIsBetDrawerOpen(false);
            }}
          />
        )
      ) : isHostQuiz ? (
        <HostQuizChallenge
          challengeId={activeChallenge.id}
          maxPoints={activeChallenge.maxPoints}
          playerToken={playerToken}
        />
      ) : (
        <div className="challenge-drawer__content">
          <p className="challenge-drawer__eyebrow">WYZWANIE W TOKU</p>
          <h2 id="active-challenge-title">{activeChallenge.name}</h2>
          <p id="active-challenge-description">Wykonaj zadanie zgodnie z instrukcjami prowadzącego.</p>
        </div>
      )}
    </section>
  );
}
