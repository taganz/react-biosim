//import {PHENOTYPE_COLOR_MODE} from "../simulationConstants"
import CreatureBrain from "./brain/CreatureBrain";
import {Genus} from "./CreatureGenus";
import { PhenoTypeColorMode } from "./PhenoTypeColorMode";

// hues reserved for plants in the "greenPlants" mode. The rest of creatures avoid
// a wider range, so that no yellow-green or blue-green can pass for a plant
const PLANT_HUE_MIN = 95;
const PLANT_HUE_MAX = 140;
const GREEN_HUE_MIN = 70;
const GREEN_HUE_MAX = 170;

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
                if (genus == "attack_plant") return "#CCCC00";
                if (genus == "attack_animal") return "#FF0000";
                if (genus == "unknown") return "#444444";
                throw new Error("error genus");
                break;
            */
           case "trophicLevel":
                return CreaturePhenothype.trophicLevelColorAssign(genus, brain.genome.getColorNumber());
                break;
           case "greenPlants":
                return CreaturePhenothype.greenPlantsColorAssign(genus, brain.genome.getHash());
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
        } else if (genus == "attack_plant") {
            color = `rgb(0, 0, ${colorMain})`;  // blue
        } else if (genus == "attack_animal") {
            color = `rgb(${colorMain}, 0, 0)`;  // red
        } else {
            color = 'black'; 
        }
        return color;
    }

    // plants get a shade of green, the rest any colour outside the greens
    static greenPlantsColorAssign(genus: Genus, genomeHash: number): string {
        const hueBits = genomeHash & 0xFFFF;
        const saturationBits = (genomeHash >>> 16) & 0xFF;
        const lightnessBits = genomeHash >>> 24;

        if (genus == "plant") {
            const hue = PLANT_HUE_MIN + (hueBits % (PLANT_HUE_MAX - PLANT_HUE_MIN + 1));
            const saturation = 55 + (saturationBits % 46);
            const lightness = 22 + (lightnessBits % 39);
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }

        // the free hues wrap around 360, from the end of the greens to the start
        const freeHues = 360 - (GREEN_HUE_MAX - GREEN_HUE_MIN + 1);
        const hue = (GREEN_HUE_MAX + 1 + (hueBits % freeHues)) % 360;
        const saturation = 65 + (saturationBits % 36);
        const lightness = 40 + (lightnessBits % 26);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }


}