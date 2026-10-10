"use client";

import { useContext } from "react";
import { getTabId, getTabPanelId, tabsContext } from "./Tabs";

interface Props extends React.PropsWithChildren {
  index: number;
}

export default function TabPanel({ index, children }: Props) {
  const { currentIndex, baseId } = useContext(tabsContext);
  const isActive = index === currentIndex;

  return (
    <>
      {isActive ? (
        <div
          role="tabpanel"
          id={getTabPanelId(baseId, index)}
          aria-labelledby={getTabId(baseId, index)}
          tabIndex={0}
          className={"border-t-2 border-grey-mid py-4"}
        >
          {children}
        </div>
      ) : null}
    </>
  );
}
