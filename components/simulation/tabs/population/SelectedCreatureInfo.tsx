import { useAtomValue, useAtom } from "jotai";
import { worldControllerAtom, selectedCreatureAtom } from "../../store";
import { useEffect, useRef } from "react";
import { Species } from "../../../../simulation/creature/Species";
import { useWindowSize } from "react-use";
import { drawCreatureNeuronalNetwork } from "@/simulation/creature/brain/Helpers/drawCreatureNeuronalNetwork";
import CopyToClipboardTextarea from "@/components/global/inputs/CopyToClipboardTextarea";
import Creature from "@/simulation/creature/Creature";

interface Props {
  creature: Creature;
}

export default function SelectedCreaturedInfo({
  creature
}: Props) {
  const worldController = useAtomValue(worldControllerAtom);
  const graphCanvas = useRef<HTMLCanvasElement>(null);
  const { width } = useWindowSize();
  const [selectedCreature, setSelectedCreature] = useAtom(selectedCreatureAtom);


  return (
    <div>
      <p className="my-4 text-2xl">
      Selected creature
    </p>
      id: {selectedCreature ? selectedCreature.id : ""}
      <p></p>
      mass: {selectedCreature ? selectedCreature.mass.toFixed(1) : ""}
      <p/>
      genus : {selectedCreature ? selectedCreature._genus : ""}
      <p></p>
    </div>
)}