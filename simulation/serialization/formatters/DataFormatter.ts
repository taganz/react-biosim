import WorldController from "../../world/WorldController";

export type DataFormatter<T, U> = {
  serialize(item: T): U;
  deserialize(data: U, worldController?: WorldController): T;
};
