import {PHENOTYPE_COLOR_MODE} from "../simulationConstants"
import CreatureBrain from "./brain/CreatureBrain";
import {Genus} from "./CreatureGenus";

export default class CreaturePhenothype {
    
    constructor() {
    }


    static getColor(genus: Genus, brain: CreatureBrain): string {
        switch(PHENOTYPE_COLOR_MODE) {
            case "genome":
                return brain.genome.getColor();
            case "trophicLevel":
                if (genus == "plant") return "#008000";
                if (genus == "attack") return "#0000FF";
                if (genus == "move") return "#CCCC00";
                if (genus == "attack&move") return "#FF0000";
                break;
            default:
                throw new Error("error PHENOTYPE_COLOR_MODE")
        }
    return "#808080";


    }
}