"use client";

import { useState } from "react";

// copies text to the clipboard and remembers the key of the last copy, to show it was copied
export default function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(key);
        window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
      },
      (error) => console.error("Could not copy:", error)
    );
  };
  return { copied, copy };
}
