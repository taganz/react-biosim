import React from 'react';

import {atom, useAtom, useSetAtom} from 'jotai';
import {worldObjectsAtom} from "../../store/worldAtoms";

import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import WorldObject from "@/simulation/world/WorldObject";
import {Dropdown, Option} from "./Dropdown";

export default function ScenariosSelection () {
    
  const setWorldObjectsAtom = useSetAtom(worldObjectsAtom);

  let selection : number = 0;
  let scenarios : Option[] = [
    {value: '0', label: 'scenario 1'},
    {value: '1', label: 'scenario 2'},
    {value: '2', label: 'scenario 3'}
    ];


    // List of scenarios.
    // TODO To be read from file 
    const objectLists : WorldObject[][] = [];
    objectLists.push(([
      // A reproduction zone at the center
      new RectangleReproductionArea(0.25, 0.25, 0.5, 0.5, true),
      // A map divided in two sections by 5 squares
      new RectangleObject(0, 0, 0.2, 0.2),
      new RectangleObject(0.2, 0.2, 0.2, 0.2),
      new RectangleObject(0.4, 0.4, 0.2, 0.2),
      new RectangleObject(0.6, 0.6, 0.2, 0.2),
      new RectangleObject(0.8, 0.8, 0.2, 0.2),
      // A spawn zone at the center
      new RectangleSpawnArea(0.4, 0.4, 0.2, 0.2, true),
    ]));
    objectLists.push([
      // A spawn zone at top left
      new RectangleSpawnArea(0.1, 0.1, 0.2, 0.2, true),
      // A reproduction zone at  center
      new RectangleReproductionArea(0.3, 0.6, 0.2, 0.4, true),
      // A map divided at bottom by 5 columns
      new RectangleObject(0.1, 0.6, 0.04, 0.4),
      new RectangleObject(0.3, 0.6, 0.04, 0.4),
      new RectangleObject(0.5, 0.6, 0.04, 0.4),
      new RectangleObject(0.7, 0.6, 0.04, 0.4),
      new RectangleObject(0.9, 0.6, 0.04, 0.4),
      
    ]);;
    objectLists.push([
      // A spawn zone at top left
      new RectangleSpawnArea(0.1, 0.1, 0.2, 0.2, true),
      // A reproduction zone at  center
      new RectangleReproductionArea(0.3, 0.6, 0.2, 0.4, true),
      // A map divided at bottom by 5 columns
      new RectangleObject(0.1, 0.6, 0.04, 0.4),
      new RectangleObject(0.3, 0.6, 0.04, 0.4),
      new RectangleObject(0.5, 0.6, 0.04, 0.4),
      new RectangleObject(0.7, 0.6, 0.04, 0.4),
      new RectangleObject(0.9, 0.6, 0.04, 0.4),
      
    ]);;
  const updateObjects = (newObjects : WorldObject[]) => {
    setWorldObjectsAtom(newObjects);
  };
  
  // Función para manejar el cambio de selección
  const handleSelection = (value: string) => {
        updateObjects(objectLists[parseInt(value)]);
    }
    
  
return (
  <div className="mb-1">
    <h2>Scenario for next simulation: </h2>
    <Dropdown options={scenarios} onSelect={handleSelection} />
    <br/>
    <p>You need to restart the simulation for these scenario to work. </p>
  </div>
);
};
