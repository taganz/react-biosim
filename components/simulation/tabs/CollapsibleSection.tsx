"use client";

import { PropsWithChildren, ReactNode, useState, useSyncExternalStore } from "react";

interface Props extends PropsWithChildren {
  title: ReactNode;
  defaultOpen?: boolean;
  description?: ReactNode;
  /** marks the title, e.g. a section with changes that are not applied */
  badge?: ReactNode;
  /**
   * Remembers in sessionStorage whether the section is open, so it survives switching tabs
   * and reloading. Without it the state lasts while the section is mounted.
   */
  storageKey?: string;
}

const STORAGE_PREFIX = "biosim.section.";

const readStored = (key: string): boolean | undefined => {
  try {
    const value = sessionStorage.getItem(STORAGE_PREFIX + key);
    return value === null ? undefined : value === "open";
  } catch {
    return undefined;
  }
};

const writeStored = (key: string, open: boolean) => {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, open ? "open" : "closed");
  } catch {
    // storage blocked: the state lasts while the section is mounted
  }
};

// sessionStorage is only read; the component keeps the value it writes in its own state
const subscribe = () => () => {};

// A section the user closed stays closed while the selection changes. Without storageKey it
// goes back to defaultOpen when the section is mounted again.
export default function CollapsibleSection({
  title, defaultOpen = false, description, badge, storageKey, children,
}: Props) {
  // the server render has no sessionStorage, so it uses defaultOpen
  const stored = useSyncExternalStore(
    subscribe,
    () => (storageKey ? readStored(storageKey) : undefined),
    () => undefined
  );
  const [toggled, setToggled] = useState<boolean | undefined>(undefined);
  const open = toggled ?? stored ?? defaultOpen;

  return (
    <details
      open={open}
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        if (isOpen === open) return;
        setToggled(isOpen);
        if (storageKey) writeStored(storageKey, isOpen);
      }}
      className="group border-t border-grey-mid pt-2"
    >
      <summary className="cursor-pointer text-xl font-bold">
        {title}
        {badge && <span className="ml-2 align-middle text-sm font-normal">{badge}</span>}
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {description && <p className="text-sm">{description}</p>}
        {children}
      </div>
    </details>
  );
}
