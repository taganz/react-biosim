import classNames from "classnames";
import { Species } from "../../../../simulation/creature/Species";

interface Props {
  species: Species;
  isSelected?: boolean;
  onClick?: (species: Species) => void;
}

export default function SpeciesButton({ species, isSelected, onClick }: Props) {
  const { genome, creatures } = species;

  return (
    <div className={classNames("p-0.5", isSelected && "bg-white")}>
      <button
        className={classNames(
          "h-10 w-10",
          isSelected && "border-2 border-white"
        )}
        style={{ backgroundColor: genome.getColor() }}
        onClick={() => onClick && onClick(species)}
      >
        <span className="text-shadow-sm">{creatures.length}</span>
      </button>
    </div>
  );
}
