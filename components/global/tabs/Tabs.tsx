"use client";

import { createContext, useId, useState } from "react";

interface Props extends React.PropsWithChildren {}

const defaultContextValue = {
  currentIndex: 0,
  setCurrentIndex: (value: number) => {},
  // prefix for the ids that link each tab with its panel
  baseId: "",
};
export const tabsContext = createContext(defaultContextValue);

export const getTabId = (baseId: string, index: number) => `${baseId}-tab-${index}`;
export const getTabPanelId = (baseId: string, index: number) => `${baseId}-panel-${index}`;

export default function Tabs({ children, ...rest }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const baseId = useId();

  return (
    <tabsContext.Provider value={{ currentIndex, setCurrentIndex, baseId }}>
      <div {...rest}>{children}</div>
    </tabsContext.Provider>
  );
}
