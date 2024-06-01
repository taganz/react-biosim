
import CreatureActions from "@/simulation/creature/brain/CreatureActions";
import { ActionName } from "@/simulation/creature/brain/CreatureActions";

/* https://jestjs.io/docs/expect  */

describe('CreatureActions', () => {
    
    let ca : CreatureActions;
    const allActions = [
           "MoveNorth",        // 0
           "MoveSouth",        // 1
           "MoveEast",         // 2
           "MoveWest",         // 3
           "RandomMove",       // 4
           "MoveForward",      // 5
           "Photosynthesis",   // 6 
           "Reproduction",     // 7
           "Attack",           // 8
         ];

    beforeEach(() => {
        ca = new CreatureActions(0.1, 0.5);
      });

    afterEach(() => {
    });
  
    test('loadFromList 2 actions and update neuronCount to 2', () => {
        const enabledActions = [
               "Photosynthesis",   // 6 
               "Reproduction",     // 7
             ];
        ca.loadFromList(enabledActions);
        expect(ca.neuronsCount).toBe(2);
        expect(ca.neuronsCount).toBe(ca.enabledActions.length);  // all neuronsCount should be 1
    });
    test('loadFromList 2 actions and return correct getList', () => {
        const enabledActions = [
               "Photosynthesis",   // 6 
               "Reproduction",     // 7
             ];
        ca.loadFromList(enabledActions);
        expect(ca.enabledActions).toStrictEqual(enabledActions);
    });
    test('actionsByCompatibleGenus ', () => {
        const enabledActions = [
               "MoveNorth",   
               "Reproduction",     
             ];
        ca.loadFromList(enabledActions);
        expect(ca.actionsByCompatibleGenus(0)).toStrictEqual(["attack_plant", "attack_animal"]);
        expect(ca.actionsByCompatibleGenus(1)).toStrictEqual(["plant", "attack_plant", "attack_animal"]);
    });
    test('actionsByCompatibleGenus throw error if invalid index ', () => {
        expect(() => {
            const enabledActions = [
                "MoveNorth",   
                "Reproduction",     
              ];
             ca.loadFromList(enabledActions);
             ca.actionsByCompatibleGenus(2);
            }).toThrow();
    });
    test ('actionNameToId()', () => {
      const enabledActions : ActionName[] = [
          "MoveNorth"          
        , "Reproduction"         
      ];
      ca.loadFromList(enabledActions);
      expect(ca.actionNameToId("MoveNorth")).toBe(0);
      expect(ca.actionNameToId("Reproduction")).toBe(1);
    });
    test ('enabledActionsForFamily()', () => {
      const enabledSensors : ActionName[] = [
        "MoveNorth",        // 0
        "MoveSouth",        // 1
        "MoveEast",         // 2
        "MoveWest",         // 3
        "RandomMove",       // 4
        "MoveForward",      // 5
        "Photosynthesis",   // 6 
        "Reproduction",     // 7
        "AttackPlant",      // 8
        "AttackAnimal",     // 9
    ];
    ca.loadFromList(enabledSensors);
      //console.log("ca.enabledSensorsForFamily()\n\n", ca.enabledSensorsForFamily("attack"));
      expect(ca.enabledActionsForGenus("plant")).toEqual([
      //  "MoveNorth",        // 0
      //  "MoveSouth",        // 1
      //  "MoveEast",         // 2
      //  "MoveWest",         // 3
      //  "RandomMove",       // 4
      //  "MoveForward",      // 5
        "Photosynthesis",   // 6 
        "Reproduction",     // 7
      //  "AttackPlant",           // 8
      //  "AttackAnimal",           // 9
      ]);
      expect(ca.enabledActionsForGenus("attack_plant")).toEqual([
        "MoveNorth",        // 0
        "MoveSouth",        // 1
        "MoveEast",         // 2
        "MoveWest",         // 3
        "RandomMove",       // 4
        "MoveForward",      // 5
      //  "Photosynthesis",   // 6 
        "Reproduction",     // 7
        "AttackPlant",           // 8
      //  "AttackAnimal",           // 9
    ]);

      expect(ca.enabledActionsForGenus("attack_animal")).toEqual([
        "MoveNorth",        // 0
        "MoveSouth",        // 1
        "MoveEast",         // 2
        "MoveWest",         // 3
        "RandomMove",       // 4
        "MoveForward",      // 5
      //  "Photosynthesis",   // 6 
        "Reproduction",     // 7
        "AttackPlant",           // 8
        "AttackAnimal",           // 9
    ]);
    });

})


