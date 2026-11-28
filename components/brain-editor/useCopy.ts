"use client";

import { useState } from "react";

// the Clipboard API is missing or denied in some cases (a page opened as file://, embedded
// views): copy through a hidden textarea instead
function copyWithTextarea(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  textarea.remove();
  return ok;
}

// copies text to the clipboard and remembers the key of the last copy, to show it was copied
export default function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const done = (key: string) => {
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
  };
  const copy = (text: string, key: string) => {
    const fallback = () => {
      if (copyWithTextarea(text)) done(key);
      else console.error("Could not copy to the clipboard");
    };
    if (!navigator.clipboard?.writeText) return fallback();
    navigator.clipboard.writeText(text).then(() => done(key), fallback);
  };
  return { copied, copy };
}
