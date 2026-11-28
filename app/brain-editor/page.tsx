import { Metadata } from "next";
import BrainEditor from "@/components/brain-editor/BrainEditor";

export const metadata: Metadata = {
  title: "Brain editor - react-biosim",
  description: "Open a .sim file, see the brains of its species, edit them and save the file again.",
};

export default function BrainEditorPage() {
  return (
    <main className="min-h-screen bg-grey-dark text-white">
      <BrainEditor />
    </main>
  );
}
