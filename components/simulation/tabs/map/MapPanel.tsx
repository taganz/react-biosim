import MapDesigner from "./MapDesigner";

export default function LoadPanel() {
  return (
  <div>
      <p className="mb-2">
        Edit the map and pres &quot;Use Map&quot; button to load it into the scenario.
      </p>
      <br/>
      <MapDesigner />
  </div>
  );

}
