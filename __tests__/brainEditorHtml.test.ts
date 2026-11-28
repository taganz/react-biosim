import { execFileSync } from "child_process";
import path from "path";

/* public/brain-editor.html is generated from components/brain-editor/ and the engine code it uses.
   The build runs in its own process: Tailwind cannot be loaded inside Jest */

test("public/brain-editor.html is up to date (otherwise run npm run build:brain-editor)", () => {
  const root = path.resolve(__dirname, "..");
  const tsx = path.join(root, "node_modules", ".bin", "tsx");
  let output = "";
  try {
    output = execFileSync(tsx, ["scripts/build-brain-editor.ts", "--check"], { cwd: root, encoding: "utf-8", stdio: "pipe" });
  } catch (error) {
    const { stderr, stdout } = error as { stderr?: string; stdout?: string };
    throw new Error(`${stdout ?? ""}${stderr ?? ""}`.trim() || String(error));
  }
  expect(output).toContain("is up to date");
}, 60000);
