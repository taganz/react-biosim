import React from 'react';

import {atom, useAtom, useSetAtom} from 'jotai';
import {worldObjectsAtom} from "../../store/worldAtoms";


import WorldObject from "@/simulation/world/WorldObject";
import {Dropdown, Option} from "./Dropdown";
import { Color } from 'd3';
import {scenarios, objectLists} from "./scenarios";
export default function ScenariosSelection () {
    
  const setWorldObjectsAtom = useSetAtom(worldObjectsAtom);

  let selection : number = 0;

    

  const updateObjects = (newObjects : WorldObject[]) => {
    setWorldObjectsAtom(newObjects);
  };
  
  // Función para manejar el cambio de selección
  const handleSelection = (value: string) => {
        updateObjects(objectLists[parseInt(value)].worldObjects);
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
