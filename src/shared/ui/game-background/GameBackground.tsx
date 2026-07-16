export function GameBackground() {
  return (
    <div className="background-shapes" aria-hidden="true">
      <span className="stadium-band stadium-band--left" />
      <span className="stadium-band stadium-band--right" />
      <span className="stadium-corner stadium-corner--red" />
      <span className="stadium-corner stadium-corner--yellow" />
      <span className="stadium-pitch">
        <i className="stadium-pitch__line" />
        <i className="stadium-pitch__circle" />
        <i className="stadium-pitch__box stadium-pitch__box--left" />
        <i className="stadium-pitch__box stadium-pitch__box--right" />
      </span>
    </div>
  );
}
