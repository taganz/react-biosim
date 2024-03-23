import {Option} from "../../../global/inputs/Dropdown";
import WorldObject from "@/simulation/world/WorldObject";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import EllipseReproductionArea from "@/simulation/world/areas/reproduction/EllipseReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import EllipseObject from "@/simulation/world/objects/EllipseObject";


// TODO implement missing objects - Health


// format for maps recoverd from save files
// TODO search original format
type mapFromSaveFile = {
    "data" : {
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "relative": boolean,
      "individualPixels"?: boolean;
      "color"?: string
    },
    "type": "RectangleObject" | "RectangleReproductionArea" | "RectangleSpawnArea" | "EllipseObject" | "EllipseReproductionArea",
    };

// this reads the exported map cut from a save file
function convertMapSim (m : mapFromSaveFile[]): WorldObject[] {
    const a : WorldObject[] = [];
    for (let i = 0; i< m.length; i++) {
    let d = m[i].data;
    switch(m[i].type) {
        case "RectangleObject":
        a.push(new RectangleObject(d.x, d.y, d.width, d.height));
        break;
        case "RectangleReproductionArea":
        a.push(new RectangleReproductionArea(d.x, d.y, d.width, d.height, true));
        break;
        case "RectangleSpawnArea":
        a.push(new RectangleSpawnArea(d.x, d.y, d.width, d.height, true));
        break;
        case "EllipseReproductionArea":
        a.push(new EllipseReproductionArea(d.x, d.y, d.width, d.height, true));
        break;
        case "EllipseObject":
        a.push(new EllipseObject(d.x, d.y, d.width, d.height, true, true));
        break;
        default: 
        console.error("convertMapSim invalid type ", m[i].type)
    }
}
return a;
}


  // List of scenarios.
  // TODO To be read from file 
  export const scenariosObjectLists : {title: string, worldObjects : WorldObject[]}[] = [];


  const map1 : mapFromSaveFile[] = [{"data":{"x":0.81,"y":0,"width":0.18999999999999995,"height":0.19999999999999996,"relative":true},"type":"RectangleReproductionArea"}];
  const map2 : mapFromSaveFile[] = [{"data":{"x":0.1,"y":0.1,"width":0.2,"height":0.2,"relative":true},"type":"RectangleSpawnArea"},{"data":{"x":0.3,"y":0.6,"width":0.2,"height":0.4,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.1,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.3,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.5,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.7,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.9,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}];
  const mapSim9 : mapFromSaveFile[] = [{"data":{"x":0,"y":0.82,"width":0.72,"height":0.18000000000000005,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0.59,"y":0.57,"width":0.06000000000000005,"height":0.28000000000000014,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.9,"y":0.6,"width":0.04,"height":0.4,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.06,"y":0.01,"width":0.6599999999999999,"height":0.55,"relative":true},"type":"RectangleSpawnArea"},
  {"data":{"x":0.38,"y":0.22,"width":0.2,"height":0.2,"relative":true,"individualPixels":true,"color":"rgb(60, 60, 60)"},"type":"EllipseObject"},
  {"data":{"x":0.25,"y":0.47,"width":0.2,"height":0.2,"relative":true,"individualPixels":true,"color":"rgb(60, 60, 60)"},"type":"EllipseObject"},
  {"data":{"x":0.66,"y":0.3,"width":0.2,"height":0.2,"relative":true,"individualPixels":true,"color":"rgb(60, 60, 60)"},"type":"EllipseObject"},{"data":{"x":0,"y":0.76,"width":0.5900000000000001,"height":0.09000000000000008,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}];
  const mapSim11 : mapFromSaveFile[] = [{"data":{"x":0.41,"y":0.61,"width":0.36000000000000004,"height":0.38,"relative":true},"type":"RectangleSpawnArea"},
  {"data":{"x":0,"y":0,"width":0.3,"height":0.21,"relative":true},"type":"RectangleReproductionArea"},
  {"data":{"x":0.46,"y":0.17,"width":0.11999999999999994,"height":0.04999999999999999,"relative":true},"type":"RectangleReproductionArea"},
  {"data":{"x":0.94,"y":0.39,"width":0.07000000000000006,"height":0.03999999999999998,"relative":true},"type":"RectangleReproductionArea"},
  {"data":{"x":0.11,"y":0.38,"width":0.10999999999999993,"height":0.06,"relative":true},"type":"RectangleReproductionArea"},
  {"data":{"x":0.39,"y":0.2,"width":0.10999999999999999,"height":0.14,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},
  {"data":{"x":0.87,"y":0.34,"width":0.13,"height":0.07999999999999996,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},
  {"data":{"x":0,"y":0.34,"width":0.23,"height":0.07999999999999996,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},
  {"data":{"x":0.4,"y":0.12,"width":0.37,"height":0.08,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},
  {"data":{"x":0.47,"y":0.49,"width":0.19000000000000006,"height":0.07999999999999996,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},
  {"data":{"x":0,"y":0.74,"width":0.26,"height":0.07999999999999996,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},
  {"data":{"x":0.24,"y":0.56,"width":0.24,"height":0.08999999999999986,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}];
  
  const mapCarlos : mapFromSaveFile[] = [{"data":{"x":0.25,"y":0.25,"width":0.5,"height":0.5,"relative":true},"type":"RectangleReproductionArea"},{"data":{"x":0,"y":0,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.2,"y":0.2,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.4,"y":0.4,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.6,"y":0.6,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"},{"data":{"x":0.8,"y":0.8,"width":0.2,"height":0.2,"relative":true,"color":"rgb(60, 60, 60)"},"type":"RectangleObject"}];
  scenariosObjectLists.push({title: "Start here", worldObjects: convertMapSim(map1)});
  scenariosObjectLists.push({title: "Vertical bins", worldObjects: convertMapSim(map2)});
  scenariosObjectLists.push({title: "Go to the bottom", worldObjects: convertMapSim(mapSim9)});
  scenariosObjectLists.push({title: "Search path to the corner", worldObjects: convertMapSim(mapSim11)});
  scenariosObjectLists.push({title: "Carlos original", worldObjects: convertMapSim(mapCarlos)});
  

//export const scenarios: Option[] = Array.from({ length: objectLists.length }, (_, i) => ({ value: i.toString(), label: `scenario ${i + 1}` }));
export const scenariosOptions: Option[] = Array.from({ length: scenariosObjectLists.length }, (_, i) => ({ value: i.toString(), label: scenariosObjectLists[i].title }));
