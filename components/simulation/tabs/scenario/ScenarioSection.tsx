import { ReactNode } from "react";
import CollapsibleSection from "../CollapsibleSection";
import { ScenarioSection as SectionId } from "./scenarioSectionChanges";

// A section of the Scenario tab: closed at first, remembered while the browser tab is open,
// and marked when its fields hold changes that are not applied yet. The species of a loaded
// file are the result of loading it: that section opens after each load and is not remembered.
export default function ScenarioSection({ id, changed, title, description, defaultOpen, children }: {
  id: SectionId | "load" | "species";
  changed?: Set<SectionId>;
  title: string;
  description?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const isChanged = id !== "load" && id !== "species" && Boolean(changed?.has(id));
  return (
    <CollapsibleSection
      title={title}
      description={description}
      defaultOpen={defaultOpen}
      storageKey={id === "species" ? undefined : `scenario.${id}`}
      badge={isChanged ? <span className="rounded-sm bg-grey-mid px-1.5 py-0.5">● not applied</span> : undefined}
    >
      {children}
    </CollapsibleSection>
  );
}
