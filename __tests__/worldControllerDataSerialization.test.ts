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
});
