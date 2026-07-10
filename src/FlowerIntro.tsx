type FlowerIntroProps = {
  clickCount: number;
  onIntroClick: () => void;
};

function FlowerIntro({ clickCount, onIntroClick }: FlowerIntroProps) {
  return (
    <section className="sphere-intro" aria-label="Intro de la carte de retraite">
      <button
        className={`sphere-button sphere-button-click-${clickCount}`}
        type="button"
        aria-label="Cliquer trois fois pour ouvrir la carte"
        onClick={onIntroClick}
      >
        <span className="sphere-core" aria-hidden="true" />
        <span className="sphere-ring sphere-ring-1" aria-hidden="true" />
        <span className="sphere-ring sphere-ring-2" aria-hidden="true" />
        <span className="sphere-sparkles" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      </button>
    </section>
  );
}

export default FlowerIntro;
