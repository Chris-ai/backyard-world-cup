import "./NotFoundPage.css";

export function NotFoundPage() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <span className="not-found__code" aria-hidden="true">404</span>
      <p className="not-found__eyebrow">BRAK ZAPROSZENIA</p>
      <h1 id="not-found-title">Nie znaleźliśmy Twojej drużyny</h1>
      <p>
        Wejdź do gry, skanując kod QR znajdujący się na Twoim kubku.
        Dzięki niemu rozpoznamy Twój kraj i miejsce w turnieju.
      </p>
      <div className="not-found__hint">
        <span aria-hidden="true">▦</span>
        ZESKANUJ KOD QR, ABY DOŁĄCZYĆ
      </div>
    </section>
  );
}
