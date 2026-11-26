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
      // a species is a lineage: two species can have the same genes
      let species: SavedSpecies | undefined = creatureMap.get(creature.speciesId);
      if (!species) {
        const firstGen = worldController.generations.speciesRegistry.firstGenOf(creature.speciesId);
        species = {
          genes: creature.brain.genome.genes,
          creatures: [],
          id: creature.speciesId,
          parentId: creature.speciesParentId,
          ...(firstGen !== undefined ? { firstGen } : {}),
        };
        creatureMap.set(creature.speciesId, species);
      }
  
      species.creatures.push({
        lastMovement: creature.lastMovement,
        lastPosition: creature.lastPosition,
        position: creature.position,
        mass: creature.mass,
        massAtBirth: creature.massAtBirth,
        age: creature._age,
        ...(creature.brain.stamina < 1
          ? { thinkCharge: creature.thinkCharge, urgeToMove: [creature.urgeToMove[0], creature.urgeToMove[1]] as [number, number] }
          : {}),
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
      const species = new Species(genome, [], savedSpecies.id, savedSpecies.parentId ?? null, savedSpecies.firstGen);
      species.creatures = savedSpecies.creatures.map(creature => {
        const deserialized = deserializeCreature(worldController, genome, creature);
        deserialized.speciesId = species.id;
        deserialized.speciesParentId = species.parentId;
        return deserialized;
      });
      return species;
    });
  }


  function deserializeCreature(worldController: WorldController, genome: Genome, savedCreature: SavedCreature) : Creature {
      const creature = new Creature(worldController.generations, savedCreature.position, false, genome);
      creature.lastMovement = savedCreature.lastMovement;
      creature.lastPosition = savedCreature.lastPosition;
      creature.massAtBirth = savedCreature.massAtBirth;
      // files from older versions may not have it
      if (savedCreature.mass !== undefined) {
        creature._mass.setStartMass(savedCreature.mass);
      }
      // without it, a resumed continuous run has no deaths of old age until maxAge steps have passed
      if (savedCreature.age !== undefined) {
        creature._age = savedCreature.age;
      }
      if (savedCreature.thinkCharge !== undefined) {
        creature.thinkCharge = savedCreature.thinkCharge;
      }
      if (savedCreature.urgeToMove !== undefined) {
        creature.urgeToMove = [savedCreature.urgeToMove[0], savedCreature.urgeToMove[1]];
      }

      return creature;
  }