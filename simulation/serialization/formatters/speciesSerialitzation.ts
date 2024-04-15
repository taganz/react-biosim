import WorldController from '@/simulation/world/WorldController';
import SavedSpecies from "../data/SavedSpecies";
import Creature from "@/simulation/creature/Creature";
import Genome from "@/simulation/creature/genome/Genome";

export default function serializeSpecies(worldController: WorldController) {
    
    const creatureMap = new Map<string, SavedSpecies>();
  
    // Create the species from the creature list
    for (
      let creatureIdx = 0;
      creatureIdx < worldController.generations.currentCreatures.length;
      creatureIdx++
    ) {
      const creature = worldController.generations.currentCreatures[creatureIdx];
      const genomeString = creature.genome.toDecimalString(false);
  
      let species: SavedSpecies | undefined = creatureMap.get(genomeString);
      if (!species) {
        species = {
          genes: creature.genome.genes,
          creatures: [],
        };
        creatureMap.set(genomeString, species);
      }
  
      species.creatures.push({
        lastMovement: creature.lastMovement,
        lastPosition: creature.lastPosition,
        position: creature.lastPosition,
        mass: creature.mass,
        massAtBirth: creature.massAtBirth
      });
    }
  
    // Create the final array of species
    const species: SavedSpecies[] = Array.from(creatureMap.values()).sort(
      (a, b) => b.creatures.length - a.creatures.length
    );
  
    return species;
  }
  
  export function deserializeSpecies(worldController: WorldController, species: SavedSpecies[]) : Creature[] {
    const deserializedCreatures: Creature[] = [];
    species.forEach((savedSpecies) => {
      savedSpecies.creatures.forEach((savedCreature) => {
        const genome: Genome = new Genome(savedSpecies.genes);
        const creature = new Creature(worldController.generations, savedCreature.position, savedCreature.mass, genome);
        creature.lastMovement = savedCreature.lastMovement;
        creature.lastPosition = savedCreature.lastPosition;
        creature.massAtBirth = savedCreature.massAtBirth;
  
        deserializedCreatures.push(creature);
      });
    });
  
    return deserializedCreatures;
  }