import { deserializeObjects } from "@/simulation/serialization/formatters/objectsSerialization";
import { serializeObjects } from "@/simulation/serialization/formatters/objectsSerialization";
import WorldObject from "@/simulation/world/objects/WorldObject";
import { useLocalStorage } from "react-use";

export default function useSavedMap() {
  const [savedWorldSize = 100, setSavedWorldSize] = useLocalStorage<number>(
    "mapDesignerWorldSize",
    100,
    {
      raw: false,
      serializer: (value) => value.toString(),
      deserializer: (value) => parseInt(value),
    }
  );

  const [savedMapDesignerObjects = [], setSavedMapDesignerObjects] = useLocalStorage<WorldObject[]>(
    "mapDesignerObjects",
    [],
    {
      raw: false,
      serializer: (value: WorldObject[]) =>
        JSON.stringify(serializeObjects(value)),
      deserializer: (value: string) => deserializeObjects(JSON.parse(value)),
    }
  );

  return { savedMapDesignerObjects, setSavedMapDesignerObjects, savedWorldSize, setSavedWorldSize };
}
