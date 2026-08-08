import { useEffect, useRef } from "react";

/**
 * The actual web page container. In Electron, this is a placeholder div
 * that reports its coordinates so the Main Process can position the native
 * WebContentsView over it.
 */
export default function WebView() {
  const containerRef = useRef<HTMLDivElement>(null);



  return <div ref={containerRef} className="min-h-px min-w-px flex-1 self-stretch bg-transparent max-[1000px]:min-h-[320px] max-[1000px]:w-full" data-name="webview" />;
}
