//import {PHENOTYPE_COLOR_MODE} from "../simulationConstants"
import CreatureBrain from "./brain/CreatureBrain";
import {Genus} from "./CreatureGenus";
import { PhenoTypeColorMode } from "../SimulationTypes";

export default class CreaturePhenothype {
    
    constructor() {
    }


    static getColor(colorMode: PhenoTypeColorMode, genus: Genus, brain: CreatureBrain): string {
        switch(colorMode) {
            case "genome":
                return brain.genome.getColor();
            /*
            case "trophicLevel":
                if (genus == "plant") return "#008000";
                if (genus == "attack") return "#0000FF";
                if (genus == "move") return "#CCCC00";
                if (genus == "attack_move") return "#FF0000";
                if (genus == "unknown") return "#444444";
                throw new Error("error genus");
                break;
            */
           case "trophicLevel":
                return CreaturePhenothype.trophicLevelColorAssign(genus, brain.genome.getColorNumber());
                break;
            default:
                throw new Error("error PHENOTYPE_COLOR_MODE")
        }
    return "#808080";
    }

    // assign a shade of a different color
    static trophicLevelColorAssign(genus: Genus, genomeNumber: number): string {
        let color: string;
        const maxColorNumber = 16777215;
        const colorMain = 255-Math.abs(Math.floor((genomeNumber / maxColorNumber) * 255));
    
        if (genus == "plant") {
            color = `rgb(0, ${colorMain}, 0)`; // green
        } else if (genus == "move") {
            color = `rgb(${colorMain}, ${colorMain}, 0)`;  // yellow?
        } else if (genus == "attack") {
            color = `rgb(0, 0, ${colorMain})`;  // blue
        } else if (genus == "attack_move") {
            color = `rgb(${colorMain}, 0, 0)`;  // red
        } else {
            color = 'black'; 
        }
        return color;
    }
    

}