import { atom, useAtom } from "jotai";
import { useEffect } from "react";

const isBodyScrollDisabledAtom = atom(false);

export default function useDisableBodyScroll() {
  const [isScrollDisabled, setIsScrollDisabled] = useAtom(
    isBodyScrollDisabledAtom
  );

  useEffect(() => {
    if (isScrollDisabled) {
      document.documentElement.classList.add("lock-scroll");
    } else {
      document.documentElement.classList.remove("lock-scroll");
    }
  }, [isScrollDisabled]);

  return { isScrollDisabled, setIsScrollDisabled };
}
