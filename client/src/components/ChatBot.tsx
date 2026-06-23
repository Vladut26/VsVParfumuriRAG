import {
  useState, useRef, useEffect, useCallback,
  type FC, type KeyboardEvent, type ChangeEvent,
} from "react";
import { Link }              from "react-router-dom";
import APIService            from "../services/APIService";
import { useCartStore }      from "../stores/cart";
import { useToastStore }     from "../stores/toast";
import { useChatStore }      from "../stores/chat";
import type { ChatMessage }  from "../stores/chat";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Bun venit la VsV Parfumuri! Sunt consultantul tau personal. Spune-mi ce cauti si te ajut sa gasesti parfumul perfect.",
};

const TYPING_MESSAGES = [
  "Se cauta parfumuri potrivite...",
  "Se analizeaza preferintele tale...",
  "Se pregatesc recomandari personalizate...",
];

const ChatBot: FC = () => {
  const cart  = useCartStore();
  const toast = useToastStore();
  const chatStore = useChatStore();

  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState("");
  const [typingMsg, setTypingMsg] = useState(TYPING_MESSAGES[0]);

  const endRef    = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messages = chatStore.messages.length > 0 ? chatStore.messages : [GREETING];
  const loading  = chatStore.loading;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150); }, [open]);

  useEffect(() => {
    if (loading) {
      let idx = 0;
      setTypingMsg(TYPING_MESSAGES[0]);
      typingRef.current = setInterval(() => { idx = (idx + 1) % TYPING_MESSAGES.length; setTypingMsg(TYPING_MESSAGES[idx]); }, 2500);
    } else { if (typingRef.current) clearInterval(typingRef.current); }
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [loading]);

  const handleAddToCart = (p: { id: number; name: string; brand?: string; price: number; imageUrl?: string; inStock: boolean }) => {
    cart.addItem({ id: String(p.id), name: p.name, brand: p.brand, price: p.price, imageUrl: p.imageUrl, stock: { quantity: p.inStock ? 10 : 0 } });
    toast.addToast(p.name + " adaugat in cos!", "success");
  };

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    chatStore.addMessage({ role: "user", content: msg });
    chatStore.setLoading(true);

    try {
      const history = chatStore.messages.map(m => ({ role: m.role, content: m.content }));
      const res = await APIService.chat({ message: msg, history });
      const data = res.data as { reply: string; products?: ChatMessage["products"] };
      chatStore.addMessage({ role: "assistant", content: data.reply || "", products: data.products || [] });
    } catch {
      chatStore.addMessage({ role: "assistant", content: "Imi pare rau, am intampinat o eroare. Te rog sa incerci din nou." });
    } finally { chatStore.setLoading(false); }
  }, [input, loading, chatStore]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  };

  return (
    <>
      {/* Floating Button */}
      <button onClick={() => setOpen(o => !o)} aria-label="Deschide asistentul"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-xl
          ${open ? "bg-[var(--noir)] text-white scale-95"
                 : "bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] text-[#1A1A1A] animate-pulse-glow hover:scale-110"}`}>
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" /></svg>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[420px]
                       rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-chat-slide-up border border-[var(--noir-lighter)]"
          style={{ maxHeight: "min(700px, calc(100dvh - 120px))", background: "linear-gradient(180deg, #1e1e1e 0%, #141414 100%)" }}>

          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1A1A">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif font-semibold text-white text-sm leading-none">Consultant VsV</p>
              <p className="text-[10px] text-[var(--gold)]/60 mt-0.5 tracking-wider uppercase">
                {loading ? "Analizeaza..." : "Fragrance Concierge"}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? "bg-[var(--gold)] animate-pulse" : "bg-emerald-400"}`} />
              <button onClick={() => chatStore.clearMessages()} className="text-[10px] text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors">Reset</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`flex animate-chat-bubble ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)]
                                    flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A1A1A">
                        <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" /></svg>
                    </div>
                  )}
                  <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-2xl
                    ${m.role === "user"
                      ? "bg-[var(--gold-dark)] text-white rounded-br-md"
                      : "bg-white/5 text-white/85 rounded-bl-md border border-white/5"}`}>
                    {m.content}
                  </div>
                </div>

                {/* Product cards */}
                {m.role === "assistant" && m.products && m.products.length > 0 && (
                  <div className="pl-9 mt-2 space-y-2 animate-chat-bubble">
                    <p className="text-[10px] text-[var(--gold)]/40 uppercase tracking-wider font-semibold mb-1.5">
                      Produse recomandate
                    </p>
                    {m.products.slice(0, 4).map(p => (
                      <div key={p.id} className="flex gap-2.5 bg-white/5 border border-white/8 rounded-xl p-2.5 hover:bg-white/8 transition-colors">
                        <Link to={`/product/${p.id}`} className="flex-shrink-0" onClick={() => setOpen(false)}>
                          <img src={p.imageUrl || PLACEHOLDER_IMG} alt={p.name}
                            className="w-14 h-14 rounded-lg object-cover hover:scale-105 transition-transform"
                            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[var(--gold)]/50 uppercase tracking-wider">
                            {p.category || "Parfum"}{p.brand ? ` · ${p.brand}` : ""}
                          </p>
                          <Link to={`/product/${p.id}`} onClick={() => setOpen(false)}
                            className="text-[13px] text-white/90 font-medium truncate leading-tight mt-0.5 block
                                       hover:text-[var(--gold)] transition-colors">
                            {p.name}
                          </Link>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-sm font-bold text-[var(--gold)]">{p.price.toFixed(0)} RON</span>
                            {p.inStock ? (
                              <button onClick={() => handleAddToCart(p)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider
                                           bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold)] text-[#1A1A1A]
                                           hover:shadow-md hover:shadow-[var(--gold)]/20 transition-all">
                                + Cos
                              </button>
                            ) : (
                              <span className="text-[10px] text-red-400/60">Epuizat</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-2 animate-chat-bubble">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)]
                                flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A1A1A">
                    <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" /></svg>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-white/40 font-light">{typingMsg}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Follow-up chips */}
            {!loading && messages.length > 1 && messages[messages.length - 1].role === "assistant" && (
              <div className="flex flex-wrap gap-2 pl-9 animate-chat-bubble">
                {["Arata-mi mai multe", "Ai ceva mai ieftin?", "Si pentru el?"].map(s => (
                  <button key={s} onClick={() => void send(s)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-[var(--gold)]/15
                               text-[var(--gold-light)]/60 hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/30
                               hover:text-[var(--gold-light)] transition-all duration-200">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/5 p-3 flex gap-2 items-end flex-shrink-0">
            <textarea ref={inputRef} value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Intreaba despre parfumuri..."
              rows={1} disabled={loading} maxLength={2000}
              className="flex-1 resize-none text-sm bg-white/5 text-white/90 placeholder-white/25
                         rounded-xl border border-white/10 px-4 py-2.5 outline-none
                         focus:border-[var(--gold)]/30 transition-colors max-h-24" />
            <button onClick={() => void send()} disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                         transition-all duration-200 disabled:opacity-20
                         bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)]
                         hover:shadow-lg hover:shadow-[var(--gold)]/20">
              {loading ? (
                <span className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              )}
            </button>
          </div>
          <p className="text-center text-[9px] text-white/15 pb-2 flex-shrink-0 tracking-wider uppercase">
            Powered by AI · VsV Parfumuri
          </p>
        </div>
      )}
    </>
  );
};

export default ChatBot;