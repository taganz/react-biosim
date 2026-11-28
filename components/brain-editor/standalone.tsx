// Entry of the standalone brain editor, public/brain-editor.html, built by scripts/build-brain-editor.ts.
// The same BrainEditor as the /brain-editor page of the app, without Next.js
import { createRoot } from "react-dom/client";
import BrainEditor from "./BrainEditor";

const container = document.getElementById("root");
if (!container) throw new Error("brain-editor.html has no #root element");
createRoot(container).render(
  <main className="min-h-screen bg-grey-dark text-white">
    <BrainEditor />
  </main>
);
