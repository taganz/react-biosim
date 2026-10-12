import { Genus } from "@/simulation/creature/CreatureGenus";

// common names used in the docs (reference/sensors-and-actions.md#genus)
export const GENUS_LABELS: Record<Genus, string> = {
  plant: "Plant",
  attack_plant: "Herbivore",
  attack_animal: "Carnivore",
  unknown: "Unknown",
};

// one letter for the species boxes, where there is no room for the name
export const GENUS_INITIALS: Record<Genus, string> = {
  plant: "P",
  attack_plant: "H",
  attack_animal: "C",
  unknown: "",
};
