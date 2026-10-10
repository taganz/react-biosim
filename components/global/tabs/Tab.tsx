"use client";

import { useContext } from "react";
import { getTabId, getTabPanelId, tabsContext } from "./Tabs";
import classNames from "classnames";

interface Props extends React.PropsWithChildren {
  index: number;
}

export default function Tab({ index, children }: Props) {
  const { currentIndex, setCurrentIndex, baseId } = useContext(tabsContext);
  const isActive = index === currentIndex;

  const handleClick = () => {
    setCurrentIndex(index);
  };

  return (
    <button
      role="tab"
      id={getTabId(baseId, index)}
      aria-selected={isActive}
      aria-controls={getTabPanelId(baseId, index)}
      // only the active tab is in the tab order; arrow keys move between tabs
      tabIndex={isActive ? 0 : -1}
      className={classNames(
        "border-b-2 px-4 py-2 transition-colors",
        isActive && "border-white",
        !isActive && "border-transparent"
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
