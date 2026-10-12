import SavePanel from "../save/SavePanel";
import LoadPanel from "../load/LoadPanel";
import UserScenariosPanel from "./UserScenariosPanel";

export default function FilesPanel() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h3 className="text-2xl font-bold">My scenarios</h3>
        <UserScenariosPanel />
      </section>

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
