
import CreatureActions from "@/simulation/creature/brain/CreatureActions";


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
    });
    test('loadFromList 2 actions and return correct getList', () => {
        const enabledActions = [
               "Photosynthesis",   // 6 
               "Reproduction",     // 7
             ];
        ca.loadFromList(enabledActions);
        expect(ca.getList()).toStrictEqual(enabledActions);
    });
    test('getFamilies ', () => {
        const enabledActions = [
               "MoveNorth",   
               "Reproduction",     
             ];
        ca.loadFromList(enabledActions);
        expect(ca.getFamily(0)).toBe("move");
        expect(ca.getFamily(1)).toBe("basic");
    });
    test('getFamilies throw error if invalid index ', () => {
        expect(() => {
            const enabledActions = [
                "MoveNorth",   
                "Reproduction",     
              ];
             ca.loadFromList(enabledActions);
             ca.getFamily(2);
            }).toThrow();
    });
})


