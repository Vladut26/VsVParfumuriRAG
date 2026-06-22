import { useState, useEffect, type FC } from "react";

/**
 * Floating "back to top" button — appears after scrolling 600px.
 * Positioned bottom-left to avoid collision with the ChatBot button (bottom-right).
 */
const BackToTop: FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Inapoi sus"
      className="fixed bottom-6 left-6 z-40
                 w-11 h-11 rounded-full
                 bg-white/90 backdrop-blur-sm
                 border border-gray-200
                 shadow-lg hover:shadow-xl
                 flex items-center justify-center
                 text-[var(--noir)] hover:text-[var(--gold-dark)]
                 hover:border-[var(--gold)]/30
                 transition-all duration-300
                 animate-chat-bubble"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};

export default BackToTop;