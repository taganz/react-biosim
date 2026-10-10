"use client";

import { KeyboardEvent } from "react";

interface Props extends React.PropsWithChildren {
  label?: string;
}

// Arrow keys, Home and End move between tabs and activate them (WAI-ARIA tabs pattern)
export default function TabList({ label, children }: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    );
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;

    let next: number;
    switch (e.key) {
      case "ArrowRight":
        next = (current + 1) % tabs.length;
        break;
      case "ArrowLeft":
        next = (current - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={"-m-0.5 flex flex-wrap"}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
