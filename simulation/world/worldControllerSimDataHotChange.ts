import WorldController from "@/simulation/world/WorldController";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { WaterData } from "@/simulation/water/WaterData";
import WorldObject from "./objects/WorldObject";
import { SimulationData } from "../SimulationData";

// Updates worldGenerationsData and worldControllerData with current run status vars 
// and resume worldController execution. This is intended to change initial values without 
// restarting the simulation.

export default function worldControllerSimDataHotChange(worldController: WorldController, simulationData: SimulationData) : void {

      if (worldController ) {
        const isPaused = worldController.isPaused;

        // worldGenerationsData state values 
        simulationData.worldGenerationsData.lastCreatureIdCreated = worldController.generations.lastCreatureIdCreated;
        simulationData.worldGenerationsData.lastCreatureCount = worldController.generations.lastCreatureCount;
        simulationData.worldGenerationsData.lastSurvivorsCount = worldController.generations.lastSurvivorsCount;
        simulationData.worldGenerationsData.lastFitnessMaxValue = worldController.generations.lastFitnessMaxValue;
        simulationData.worldGenerationsData.lastSurvivalRate = worldController.generations.lastSurvivalRate;
        // worldControllerData user values
        simulationData.worldControllerData.pauseBetweenSteps = worldController.pauseBetweenSteps;
        simulationData.worldControllerData.immediateSteps = worldController.immediateSteps;
        simulationData.worldControllerData.pauseBetweenGenerations = worldController.pauseBetweenGenerations;
        // worldControllerData state values
        simulationData.worldControllerData.currentGen = worldController.currentGen;
        simulationData.worldControllerData.currentStep = worldController.currentStep;
        simulationData.worldControllerData.lastGenerationDuration = worldController.lastGenerationDuration;
        simulationData.worldControllerData.totalTime = worldController.totalTime;
        
        worldController.resumeRun(simulationData);
        
        if (isPaused) {
          worldController.pause();
        }
      } else {
        console.warn("worldControllerResumeRun worldController not found!")
      }
  
    };