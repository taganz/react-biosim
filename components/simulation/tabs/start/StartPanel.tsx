"use client";

import React, { useEffect } from "react";
import ScenariosSelection from "./ScenarioSelection";



export default function StartPanel() {
  return (
    <div>
      <p className="mb-2 text-lg">
        This is an evolution simulator to observe random created creatures evolving across generations.  
        <br/><br/>
        In the first scenario creatures &quot;learn&quot; how to move to the darker right area. 
        <br/><br/>
        Try other scenarios and modify them using &quot;Settings&quot;panel: 
        <ScenariosSelection/>
        </p>
      <p className="mb-2 text-lg">
        See &quot;About&quot; tab for more info and link to David R. Miller inspiring video.
      </p>
    </div>
  );
}
