import WorldController from '@/simulation/world/WorldController';
import SavedSpecies from "../data/SavedSpecies";
import Creature from "@/simulation/creature/Creature";
import Genome from "@/simulation/creature/brain/Genome";
import { Species } from '@/simulation/creature/Species';
import SavedCreature from '../data/SavedCreature';

export default function serializeSpecies(worldController: WorldController) : SavedSpecies[] {
    
    const creatureMap = new Map<string, SavedSpecies>();
  
    // Create the species from the creature list
    for (
      let creatureIdx = 0;
      creatureIdx < worldController.generations.currentCreatures.length;
      creatureIdx++
    ) {
      const creature = worldController.generations.currentCreatures[creatureIdx];
      const genomeString = creature.brain.genome.toDecimalString(false);
  
      let species: SavedSpecies | undefined = creatureMap.get(genomeString);
      if (!species) {
        species = {
          genes: creature.brain.genome.genes,
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
  
  /*
  export function deserializeSpecies(worldController: WorldController, species: SavedSpecies[]) : Species[] {
    const deserializedSpecies: Species[] = [];
    species.forEach((savedSpecies) => {
      savedSpecies.creatures.forEach((savedCreature) => {
        const genome: Genome = new Genome(savedSpecies.genes);
        const creature = new Creature(worldController.generations, savedCreature.position, false, genome);
        creature.lastMovement = savedCreature.lastMovement;
        creature.lastPosition = savedCreature.lastPosition;
        creature.massAtBirth = savedCreature.massAtBirth;
  
        deserializedSpecies.push(creature);
      });
    });
  
    return deserializedSpecies;
  }

*/

  export function deserializeSpecies(worldController: WorldController, savedSpeciesArray: SavedSpecies[]): Species[] {
    return savedSpeciesArray.map(savedSpecies => {
      // Create a Genome instance from the genes array
      const genome = new Genome(savedSpecies.genes);
  
      // Deserialize each SavedCreature into a Creature
      const creatures = savedSpecies.creatures.map(creature => deserializeCreature(worldController, genome, creature));
  
      // Create a new Species instance with the deserialized data
      return new Species(genome, creatures);
    });
  }


  function deserializeCreature(worldController: WorldController, genome: Genome, savedCreature: SavedCreature) : Creature {
      const creature = new Creature(worldController.generations, savedCreature.position, false, genome);
      creature.lastMovement = savedCreature.lastMovement;
      creature.lastPosition = savedCreature.lastPosition;
      creature.massAtBirth = savedCreature.massAtBirth;

      return creature;
  }