import { PropsWithChildren, ReactNode } from "react";

interface Props extends PropsWithChildren {
  title: ReactNode;
  defaultOpen?: boolean;
}

// The browser keeps the open state, so a section the user closed stays closed while the
// selection changes. It only goes back to defaultOpen when the section is mounted again.
export default function CollapsibleSection({ title, defaultOpen = false, children }: Props) {
  return (
    <details open={defaultOpen} className="group border-t border-grey-mid pt-2">
      <summary className="cursor-pointer text-xl font-bold">{title}</summary>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </details>
  );
}
