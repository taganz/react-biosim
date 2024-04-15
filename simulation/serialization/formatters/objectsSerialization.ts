import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import EllipseObject from "../../world/objects/EllipseObject";
import RectangleObject from "../../world/objects/RectangleObject";
import { DataFormatter } from "./DataFormatter";
import EllipseReproductionArea from "@/simulation/world/areas/reproduction/EllipseReproductionArea";
import RectangleHealthArea from "@/simulation/world/areas/health/RectangleHealthArea";
import EllipseHealthArea from "@/simulation/world/areas/health/EllipseHealthArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import SavedWorldObject from "../data/SavedWorldObject"
import WorldObject from "@/simulation/world/objects/WorldObject"

const objectFormatters: {
  [key: string]: DataFormatter<any, { [key: string]: any }>;
} = {
  RectangleObject: {
    serialize({ x, y, width, height, relative, color }: RectangleObject) {
      return { x, y, width, height, relative, color };
    },
    deserialize(data): RectangleObject {
      return new RectangleObject(
        data.x,
        data.y,
        data.width,
        data.height,
        data.relative,
        data.color
      );
    },
  },

  EllipseObject: {
    serialize({
      x,
      y,
      width,
      height,
      relative,
      drawIndividualPixels,
      color,
    }: EllipseObject) {
      return {
        x,
        y,
        width,
        height,
        relative,
        individualPixels: drawIndividualPixels,
        color,
      };
    },
    deserialize(data): EllipseObject {
      return new EllipseObject(
        data.x,
        data.y,
        data.width,
        data.height,
        data.relative,
        data.individualPixels,
        data.color
      );
    },
  },

  RectangleReproductionArea: {
    serialize({ x, y, width, height, relative }: RectangleReproductionArea) {
      return { x, y, width, height, relative };
    },
    deserialize(data): RectangleReproductionArea {
      return new RectangleReproductionArea(
        data.x,
        data.y,
        data.width,
        data.height,
        data.relative
      );
    },
  },

  EllipseReproductionArea: {
    serialize({ x, y, width, height, relative }: EllipseReproductionArea) {
      return { x, y, width, height, relative };
    },
    deserialize(data): EllipseReproductionArea {
      return new EllipseReproductionArea(
        data.x,
        data.y,
        data.width,
        data.height,
        data.relative
      );
    },
  },

  RectangleHealthArea: {
    serialize({ x, y, width, height, relative, health }: RectangleHealthArea) {
      return { x, y, width, height, relative, health };
    },
    deserialize(data): RectangleHealthArea {
      return new RectangleHealthArea(
        data.x,
        data.y,
        data.width,
        data.height,
        data.relative,
        data.health
      );
    },
  },

  EllipseHealthArea: {
    serialize({ x, y, width, height, relative, health }: EllipseHealthArea) {
      return { x, y, width, height, relative, health };
    },
    deserialize(data): EllipseHealthArea {
      return new EllipseHealthArea(
        data.x,
        data.y,
        data.width,
        data.height,
        data.relative,
        data.health
      );
    },
  },

  RectangleSpawnArea: {
    serialize({ x, y, width, height, relative }: RectangleSpawnArea) {
      return { x, y, width, height, relative };
    },
    deserialize(data): RectangleSpawnArea {
      return new RectangleSpawnArea(
        data.x,
        data.y,
        data.width,
        data.height,
        data.relative
      );
    },
  },

};

//export default objectFormatters;




export function serializeObjects(objects: WorldObject[]) : SavedWorldObject[]{
  const serializedObjects: SavedWorldObject[] = [];

  for (let objectIndex = 0; objectIndex < objects.length; objectIndex++) {
    const obj = objects[objectIndex];

    // Find the formatter
    const className: string = obj.name;
    const formatter = objectFormatters[className];
    if (formatter) {
      // If the formatter was found, serialize the object
      const data = formatter.serialize(obj);
      // Save it
      const item: SavedWorldObject = {
        data,
        type: className,
      };
      serializedObjects.push(item);
    }
  }

  return serializedObjects;
}

export function deserializeObjects(objects: SavedWorldObject[]) : WorldObject[] {
  // Clear worldController objects
  const deserializedObjects: WorldObject[] = [];

  // Load objects
  objects.forEach((savedObject) => {
    const formatter = objectFormatters[savedObject.type];

    if (formatter) {
      const worldObject: WorldObject = formatter.deserialize(savedObject.data);
      deserializedObjects.push(worldObject);
    }
  });

  return deserializedObjects;
}
