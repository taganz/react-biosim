"use client";


import ScenariosSelection from "./ScenarioSelection";

export default function StartPanel() {
 
  return (
    <div>
      <p className="mb-2 text-lg">
        This is a simulation...:
      </p>
      <div className="text-lg">
      <ScenariosSelection></ScenariosSelection>
      </div>
    </div>
  );
}
