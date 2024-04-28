import {PHENOTYPE_COLOR_MODE} from "../simulationConstants"
import CreatureBrain from "./brain/CreatureBrain";

export default class CreaturePhenothype {
    
    constructor() {
    }


    static getColor(brain: CreatureBrain): string {
        let isPlant = false;
        let isAnimal = false;
        const colorPlant = "#008000";
        const colorAnimal = "#0000FF";
        const colorUnknown = "#808080";
        switch(PHENOTYPE_COLOR_MODE) {
            case "genome":
                return brain.genome.getColor();
            case "trophicLevel":
                brain.brain.connections.map(connection => {
                    if (connection.sinkId == 6) {    // photosyntesis
                        isPlant = true;
                    }
                    if (connection.sinkId == 8) {      // attack
                        isAnimal = true;
                    }
                });
                break;
            default:
                throw new Error("error PHENOTYPE_COLOR_MODE")
        }
    return (isAnimal ? colorAnimal : (isPlant ? colorPlant : colorUnknown));


    }
}