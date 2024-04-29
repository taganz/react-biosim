import CreatureBrain from "./brain/CreatureBrain";

export type Genus = "unknown" | "plant" | "attack" | "move" | "attack&move";

export default class CreatureGenus {
    
    constructor() {
    }


    static getGenus(brain: CreatureBrain): Genus {
        let hasPhotosynthesis = false;
        let hasAttack = false;
        let hasMove = false;
        brain.brain.connections.map(connection => {
            if (connection.sinkId < 6) {    // move
                hasMove = true;
            }
            if (connection.sinkId == 6) {    // photosyntesis
                hasPhotosynthesis = true;
            }
            if (connection.sinkId == 8) {      // attack
                hasAttack = true;
            }
        });
        if (hasMove && hasAttack) return "attack&move";
        if (hasMove) return "move";
        if (hasAttack) return "attack";
        if (hasPhotosynthesis) return "plant";
        return "unknown";
 
    }
}