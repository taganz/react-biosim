import SavePanel from "../save/SavePanel";
import LoadPanel from "../load/LoadPanel";

export default function FilesPanel() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h3 className="text-2xl font-bold">Save</h3>
        <SavePanel />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-2xl font-bold">Load</h3>
        <LoadPanel />
      </section>
    </div>
  );
}
