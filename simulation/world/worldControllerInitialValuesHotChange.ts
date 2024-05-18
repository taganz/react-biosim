import WorldController from "@/simulation/world/WorldController";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { WaterData } from "@/simulation/water/WaterData";

// Updates worldGenerationsData and worldControllerData with current run status vars 
// and resume worldController execution. This is intended to change initial values without 
// restarting the simulation.

export default function worldControllerInitialValuesHotChange(worldController: WorldController, 
      worldControllerData: WorldControllerData, worldGenerationsData: WorldGenerationsData, waterData: WaterData) : void {

      if (worldController ) {
        const isPaused = worldController.isPaused;

        // worldGenerationsData state values 
        worldGenerationsData.lastCreatureIdCreated = worldGenerationsData.lastCreatureIdCreated;
        worldGenerationsData.lastCreatureCount = worldGenerationsData.lastCreatureCount;
        worldGenerationsData.lastSurvivorsCount = worldGenerationsData.lastSurvivorsCount;
        worldGenerationsData.lastFitnessMaxValue = worldGenerationsData.lastFitnessMaxValue;
        worldGenerationsData.lastSurvivalRate = worldGenerationsData.lastSurvivalRate;
        // worldControllerData user values
        worldControllerData.pauseBetweenSteps = worldController.pauseBetweenSteps;
        worldControllerData.immediateSteps = worldController.immediateSteps;
        worldControllerData.pauseBetweenGenerations = worldController.pauseBetweenGenerations;
        // worldControllerData state values
        worldControllerData.currentGen = worldController.currentGen;
        worldControllerData.currentStep = worldController.currentStep;
        worldControllerData.lastGenerationDuration = worldController.lastGenerationDuration;
        worldControllerData.totalTime = worldController.totalTime;
        worldControllerData.waterData = waterData;
        const creatures = worldController.generations.currentCreatures;
        const stats = worldController.generationRegistry;

        worldController.resumeRun(worldControllerData, worldGenerationsData, creatures, stats);
        
        if (isPaused) {
          worldController.pause();
        }
      } else {
        console.warn("worldControllerResumeRun worldController not found!")
      }
  
    };