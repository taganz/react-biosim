import React from 'react';
import {useSetAtom} from 'jotai';
import {worldObjectsAtom} from "../../store/worldAtoms";
import {Dropdown} from "../../../global/inputs/Dropdown";
import {scenariosOptions, scenariosObjectLists} from "./scenarios";
export default function ScenariosSelection () {
    
  const setWorldObjectsAtom = useSetAtom(worldObjectsAtom);
  
  // Función para manejar el cambio de selección
  const handleSelection = (value: string) => {
        setWorldObjectsAtom(scenariosObjectLists[parseInt(value)].worldObjects);
    }
    
  
return (
  <div className="mb-1">
    <h2>Scenario for next simulation: </h2>
    <Dropdown options={scenariosOptions} onSelect={handleSelection} />
    <br/>
    <p>You need to restart the simulation for these scenario to work. </p>
  </div>
);
};
