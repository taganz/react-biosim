import classNames from "classnames";
import { Species } from "../../../../simulation/creature/Species";
import { GENUS_INITIALS, GENUS_LABELS } from "./genusLabels";

interface Props {
  species: Species;
  isSelected?: boolean;
  onClick?: (species: Species) => void;
}

export default function SpeciesButton({ species, isSelected, onClick }: Props) {
  const { creatures } = species;
  // every member shares the genome, so they all have the same genus
  const genus = creatures[0]?.genus ?? "unknown";
  const description = [
    species.genome.getHexColor(),
    genus !== "unknown" && GENUS_LABELS[genus],
    `${creatures.length} creature${creatures.length === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={classNames("p-0.5", isSelected && "bg-white")}>
      <button
        className={classNames(
          "relative h-10 w-10",
          isSelected && "border-2 border-white"
        )}
        style={{ backgroundColor: species.getColor() }}
        title={description}
        aria-label={description}
        onClick={() => onClick && onClick(species)}
      >
        <span className="text-shadow-sm">{creatures.length}</span>
        {GENUS_INITIALS[genus] && (
          <span className="text-shadow-sm absolute top-0 left-0.5 text-[0.6rem] leading-none">
            {GENUS_INITIALS[genus]}
          </span>
        )}
      </button>
    </div>
  );
}
