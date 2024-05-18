import CreatureBrain from "./brain/CreatureBrain";
import { NeuronType } from "./brain/Neuron";

export type Genus = "unknown" | "plant" | "attack" | "move" | "attack_move";

export default class CreatureGenus {
    
    constructor() {
    }


    static getGenus(brain: CreatureBrain): Genus {
        let hasBasic = false;
        let hasAttack = false;
        let hasMove = false;
        brain.brain.connections.map(connection => {
            if (connection.sinkType == NeuronType.ACTION) {
                switch(brain.actions.getFamily(connection.sinkId)) {
                    case "move":
                        hasMove = true;
                        break;
                    case "attack":
                        hasAttack = true;
                        break;
                    case "basic":
                        hasBasic = true;
                        break;
                }
            }
        });
        if (hasMove && hasAttack) return "attack_move";
        if (hasMove) return "move";
        if (hasAttack) return "attack";
        if (hasBasic) return "plant";
        return "unknown";
 
    }
}