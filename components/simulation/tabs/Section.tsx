import { ReactNode } from "react";

export const FIELDS_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

// A titled group of fields in the Scenario and Simulation tabs
export default function Section({ title, description, children }: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">{title}</h3>
      {description && <p className="text-sm">{description}</p>}
      {children}
    </section>
  );
}
