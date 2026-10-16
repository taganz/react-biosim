import { deserializeWorldControllerData } from "@/simulation/serialization/formatters/worldControllerDataSerialization";
import SavedWorldControllerData from "@/simulation/serialization/data/SavedWorldControllerData";
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";

describe('world controller data deserialization', () => {

    test('drops ATTACK_MULTIPLE_MASS_AT_BIRTH from older saves', () => {
        const saved = { ...SIMULATION_DATA_DEFAULT.worldControllerData, ATTACK_MULTIPLE_MASS_AT_BIRTH: 3 } as SavedWorldControllerData;

        const data = deserializeWorldControllerData(saved);

        expect("ATTACK_MULTIPLE_MASS_AT_BIRTH" in data).toBe(false);
        expect(data.ATTACK_MIN_PREY_MASS_FACTOR).toBe(SIMULATION_DATA_DEFAULT.worldControllerData.ATTACK_MIN_PREY_MASS_FACTOR);
    });
});
