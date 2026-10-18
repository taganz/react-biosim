import { deserializeWorldControllerData } from "@/simulation/serialization/formatters/worldControllerDataSerialization";
import SavedWorldControllerData from "@/simulation/serialization/data/SavedWorldControllerData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";

describe('world controller data deserialization', () => {

    test('drops ATTACK_MULTIPLE_MASS_AT_BIRTH from older saves', () => {
        const saved = { ...TEST_SIMULATION_DATA.worldControllerData, ATTACK_MULTIPLE_MASS_AT_BIRTH: 3 } as SavedWorldControllerData;

        const data = deserializeWorldControllerData(saved);

        expect("ATTACK_MULTIPLE_MASS_AT_BIRTH" in data).toBe(false);
        expect(data.ATTACK_MIN_PREY_MASS_FACTOR).toBe(TEST_SIMULATION_DATA.worldControllerData.ATTACK_MIN_PREY_MASS_FACTOR);
    });

    test('drops MASS_COST_PER_EXECUTE_ACTION from older saves', () => {
        const saved = { ...TEST_SIMULATION_DATA.worldControllerData, MASS_COST_PER_EXECUTE_ACTION: 0.01 } as SavedWorldControllerData;

        const data = deserializeWorldControllerData(saved);

        expect("MASS_COST_PER_EXECUTE_ACTION" in data).toBe(false);
    });

    test('older saves without ACTION_ATTACK_OFFSET take ACTION_REPRODUCTION_OFFSET', () => {
        const { ACTION_ATTACK_OFFSET, ...older } = { ...TEST_SIMULATION_DATA.worldControllerData, ACTION_REPRODUCTION_OFFSET: 0.3 };

        const data = deserializeWorldControllerData(older as SavedWorldControllerData);

        expect(data.ACTION_ATTACK_OFFSET).toBe(0.3);
    });

    test('older saves without MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY take MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE', () => {
        const { MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY, ...older } = { ...TEST_SIMULATION_DATA.worldControllerData, MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE: 0.07 };

        const data = deserializeWorldControllerData(older as SavedWorldControllerData);

        expect(data.MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY).toBe(0.07);
    });

    test('keeps ACTION_ATTACK_OFFSET when the save has it', () => {
        const saved = { ...TEST_SIMULATION_DATA.worldControllerData, ACTION_REPRODUCTION_OFFSET: 0.3, ACTION_ATTACK_OFFSET: 0.8 } as SavedWorldControllerData;

        const data = deserializeWorldControllerData(saved);

        expect(data.ACTION_ATTACK_OFFSET).toBe(0.8);
    });
});
