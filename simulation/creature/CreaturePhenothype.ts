import {PHENOTYPE_COLOR_MODE} from "../simulationConstants"
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
            case "trophicLevel":
                if (genus == "plant") return "#008000";
                if (genus == "attack") return "#0000FF";
                if (genus == "move") return "#CCCC00";
                if (genus == "attack_move") return "#FF0000";
                if (genus == "unknown") return "#444444";
                throw new Error("error genus");
                break;
            default:
                throw new Error("error PHENOTYPE_COLOR_MODE")
        }
    return "#808080";


    }
}