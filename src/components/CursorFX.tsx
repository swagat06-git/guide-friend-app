import { useEffect } from "react";

export function CursorFX() {
  useEffect(() => {
    let raf = 0;
    let x = 0;
    let y = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;

      if (!raf) {
        raf = requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--cursor-x", x + "px");
          document.documentElement.style.setProperty("--cursor-y", y + "px");
          raf = 0;
        });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <span className="atlas-cursor" aria-hidden="true" />;
}
