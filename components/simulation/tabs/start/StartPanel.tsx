"use client";

import React, { useEffect } from "react";
import ScenariosSelection from "./ScenarioSelection";



export default function StartPanel() {
  return (
    <div>
      <p className="mb-2 text-lg">
        This is an evolution simulator. Observe random created creatures evolving across generations.  
        <br/><br/>
        Start by selecting a scenario. 
      </p>
      <div className="text-lg">
      <ScenariosSelection/>
      </div>
      <p className="mb-2 text-lg">
        Create your own scenario using Settings and Map tabs.
        <br/><br/>
        See &quot;About&quot; tab for more info and link to David R. Miller inspiring video.
      </p>
    </div>
  );
}
