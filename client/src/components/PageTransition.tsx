import { type FC, type ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Wraps page content with a fade+slide animation on every route change.
 * Pure CSS — no framer-motion dependency.
 *
 * Animation: 300ms fade-in + subtle upward slide
 */
const PageTransition: FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage("exit");

      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("enter");
      }, 150); // exit duration

      return () => clearTimeout(timeout);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`page-transition ${transitionStage === "enter" ? "page-enter" : "page-exit"}`}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </div>
  );
};

export default PageTransition;