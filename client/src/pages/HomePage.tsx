import { useState, useEffect, useCallback, useRef, type FC, type ChangeEvent, type KeyboardEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuthStore }     from "../stores/auth";
import { useProductStore }  from "../stores/products";
import { useCartStore }     from "../stores/cart";
import { useToastStore }    from "../stores/toast";
import type { Product }     from "../stores/products";
import APIService           from "../services/APIService";
import MainHeader           from "../components/MainHeader";
import MainFooter           from "../components/MainFooter";
import AdminSubHeader       from "../components/AdminSubHeader";
import CategoryBar          from "../components/CategoryBar";
import ProductCard          from "../components/ProductCard";
import ProductModal         from "../components/ProductModal";
import ConfirmModal         from "../components/ConfirmModal";
import { useConfirm }       from "../hooks/useConfirm";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RecProduct {
  id: number; name: string; brand?: string; price: number;
  imageUrl?: string; category?: string; inStock: boolean;
}
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: RecProduct[];
}

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";

const PROMPTS = [
  "Gaseste-mi un parfum seducator pentru seara...",
  "Vreau ceva similar cu Baccarat Rouge 540...",
  "Recomanda-mi o aroma fresh de vara...",
  "Arata-mi parfumuri cu oud si vanilie...",
  "Am nevoie de un cadou de lux pentru ea...",
  "Ce parfum se potriveste personalitatii mele?",
];

const TYPING_MESSAGES = [
  "Se cauta parfumuri potrivite...",
  "Se analizeaza preferintele tale...",
  "Se pregatesc recomandari personalizate...",
];

const RotatingPlaceholder: FC<{ prompts: string[] }> = ({ prompts }) => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => (i + 1) % prompts.length); setVisible(true); }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [prompts.length]);
  return (
    <span className="text-[var(--gold-dark)]/40 pointer-events-none select-none transition-all duration-400"
      style={{ opacity: visible ? 0.5 : 0, transform: visible ? "translateY(0)" : "translateY(4px)" }}>
      {prompts[idx]}
    </span>
  );
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard: FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="aspect-[3/4] bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-100 rounded-full w-2/3" />
      <div className="h-4 bg-gray-100 rounded-full w-full" />
      <div className="h-5 bg-gray-100 rounded-full w-1/3" />
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const HomePage: FC = () => {
  const authStore    = useAuthStore();
  const productStore = useProductStore();
  const cart         = useCartStore();
  const toastStore   = useToastStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch]   = useState(searchParams.get("search") || "");
  const [heroQuery, setHeroQuery]       = useState("");
  const { confirm, confirmModalProps }   = useConfirm();

  // Inline AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading]   = useState(false);
  const [typingMsg, setTypingMsg]       = useState(TYPING_MESSAGES[0]);
  const chatEndRef     = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroInputRef   = useRef<HTMLInputElement>(null);

  // Autocomplete
  const [suggestions, setSuggestions]       = useState<{ id: string; name: string; brand?: string; price: number; imageUrl?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Product modal
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ── Search sync ─────────────────────────────────────────────────
  useEffect(() => {
    const q = searchParams.get("search") || "";
    setLocalSearch(q);
    productStore.setSearchQuery(q);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch) setSearchParams({ search: localSearch }, { replace: true });
      else setSearchParams({}, { replace: true });
      if (localSearch !== productStore.searchQuery) productStore.setSearchQuery(localSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // ── Autocomplete ────────────────────────────────────────────────
  useEffect(() => {
    if (localSearch.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await APIService.getProducts({ search: localSearch, size: 6 });
        const data = res.data as { content: { id: string; name: string; brand?: string; price: number; imageUrl?: string }[] };
        setSuggestions(data.content || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    const handler = (e: Event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Typing rotation ─────────────────────────────────────────────
  useEffect(() => {
    if (chatLoading) {
      let idx = 0;
      setTypingMsg(TYPING_MESSAGES[0]);
      typingRef.current = setInterval(() => { idx = (idx + 1) % TYPING_MESSAGES.length; setTypingMsg(TYPING_MESSAGES[idx]); }, 2500);
    } else { if (typingRef.current) clearInterval(typingRef.current); }
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [chatLoading]);

  // Scroll: first time → scroll page to show chat container
  // After that → only scroll inside the chat container
  const isFirstMessage = useRef(true);
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        if (isFirstMessage.current) {
          chatContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          isFirstMessage.current = false;
        }
        // Always scroll to bottom inside the chat container
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 150);
    }
    if (chatMessages.length === 0) isFirstMessage.current = true;
  }, [chatMessages, chatLoading]);

  const clearSearch = () => {
    setLocalSearch("");
    setSearchParams({}, { replace: true });
    productStore.setSearchQuery("");
  };

  // FIX #1: Send function accepts text directly (not from state)
  const sendChatMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || chatLoading) return;

    setHeroQuery("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await APIService.chat({ message: msg, history });
      const data = res.data as { reply: string; products?: RecProduct[] };
      setChatMessages(prev => [...prev, {
        role: "assistant", content: data.reply || "", products: data.products || [],
      }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Imi pare rau, am intampinat o eroare. Incearca din nou." }]);
    } finally { setChatLoading(false); }
  };

  const handleHeroSubmit = () => {
    if (heroQuery.trim()) void sendChatMessage(heroQuery);
  };

  const handleHeroKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleHeroSubmit();
  };

  // FIX #3: Clear chat
  const clearChat = () => {
    setChatMessages([]);
    setHeroQuery("");
  };

  const handleAddToCart = (p: RecProduct) => {
    cart.addItem({
      id: String(p.id), name: p.name, brand: p.brand,
      price: p.price, imageUrl: p.imageUrl,
      stock: { quantity: p.inStock ? 10 : 0 },
    });
    toastStore.addToast(p.name + " adaugat in cos!", "success");
  };

  const openCreateModal = ()           => { setSelectedProduct(null); setIsModalOpen(true); };
  const openEditModal   = (p: Product) => { setSelectedProduct(p); setIsModalOpen(true); };
  const handleSave = async (data: unknown) => {
    try {
      if (selectedProduct) {
        await productStore.updateProduct(selectedProduct.id, data as Partial<Product>);
        toastStore.addToast("Produs actualizat!", "success");
      } else {
        await productStore.createProduct(data as Partial<Product>);
        toastStore.addToast("Produs creat!", "success");
      }
      setIsModalOpen(false);
    } catch { toastStore.addToast("Eroare la salvare.", "error"); }
  };
  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: "Stergere produs", message: "Esti sigur ca vrei sa stergi acest produs? Actiunea este ireversibila.", variant: "danger", confirmLabel: "Sterge" });
    if (!ok) return;
    try { await productStore.deleteProduct(id); toastStore.addToast("Produs sters.", "warning"); }
    catch (err) { toastStore.addToast("Eroare: " + (err as Error).message, "error"); }
  };
  const handleLoadMore = useCallback(() => { void productStore.loadNextPage(); }, [productStore]);
  const hasMore = productStore.page + 1 < productStore.totalPages;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cream)]">
      <MainHeader />
      {authStore.isAdmin && <AdminSubHeader onOpenCreate={openCreateModal} />}

      {/* ── Hero: AI Fragrance Concierge ──────────────────────────── */}
      <section className="hero-luxury-bg noise-overlay relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-14 pb-10 md:pt-20 md:pb-14">
          <div className="w-12 h-[2px] bg-[var(--gold)] mb-5 opacity-60" />
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[var(--noir)] mb-2 tracking-tight leading-tight">
            Descopera Parfumul <span className="italic text-[var(--gold-dark)]">Perfect</span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-md mb-8 font-light">
            Asistentul nostru AI te ghideaza sa gasesti esenta care te defineste
          </p>

          {/* ── AI Search Input ─────────────────────────────────────── */}
          <div className="w-full max-w-2xl relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--gold)]/20 via-[var(--gold)]/10 to-[var(--rose)]/10
                            opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
            <div className="relative flex items-center bg-white rounded-2xl shadow-lg gold-glow
                            border border-[var(--gold)]/10 group-focus-within:border-[var(--gold)]/30 transition-all duration-300 overflow-hidden">
              <div className="pl-5 pr-2 text-[var(--gold)] flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
                </svg>
              </div>
              <div className="flex-1 relative py-4">
                <input ref={heroInputRef} type="text"
                  className="w-full bg-transparent outline-none text-[var(--noir)] text-base md:text-lg placeholder-transparent font-light pr-4"
                  value={heroQuery} onChange={(e) => setHeroQuery(e.target.value)} onKeyDown={handleHeroKey}
                  placeholder="Intreaba asistentul AI..." />
                {!heroQuery && chatMessages.length === 0 && (
                  <div className="absolute inset-0 flex items-center text-base md:text-lg font-light pointer-events-none">
                    <RotatingPlaceholder prompts={PROMPTS} />
                  </div>
                )}
              </div>
              <button onClick={handleHeroSubmit} disabled={!heroQuery.trim() || chatLoading}
                className="mr-3 px-5 py-2.5 rounded-xl btn-luxury text-sm font-semibold uppercase tracking-wider
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 flex-shrink-0">
                {chatLoading ? (
                  <span className="w-4 h-4 border-2 border-[var(--noir)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
                <span className="hidden sm:inline">Intreaba</span>
              </button>
            </div>
          </div>

          {/* Quick chips — only before first message */}
          {chatMessages.length === 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-5 max-w-2xl">
              {["Parfumuri florale", "Sub 300 RON", "Cadou de lux", "Parfum de seara"].map((chip) => (
                <button key={chip}
                  onClick={() => void sendChatMessage(chip)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium border border-[var(--gold)]/20 text-[var(--gold-dark)]
                             hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/40 transition-all duration-200">
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Inline AI Conversation ───────────────────────────────── */}
        {chatMessages.length > 0 && (
          <div ref={chatContainerRef} className="relative z-10 max-w-2xl mx-auto px-4 pb-8">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[var(--gold)]/10 shadow-lg overflow-hidden">

              {/* FIX #3: Chat header with clear button */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--gold)]/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)]
                                  flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#1A1A1A">
                      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-[var(--noir)]">Consultant AI</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${chatLoading ? "bg-[var(--gold)] animate-pulse" : "bg-emerald-400"}`} />
                </div>
                <button onClick={clearChat}
                  className="text-[10px] text-gray-400 hover:text-[var(--noir)] uppercase tracking-wider font-medium transition-colors
                             flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Inchide
                </button>
              </div>

              {/* Messages */}
              <div className="max-h-[50vh] overflow-y-auto p-5 space-y-4">
                {chatMessages.map((m, i) => (
                  <div key={i}>
                    <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-chat-bubble`}>
                      {m.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)]
                                        flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-sm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A1A1A">
                            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
                          </svg>
                        </div>
                      )}
                      <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-2xl
                        ${m.role === "user"
                          ? "bg-[var(--gold-dark)] text-white rounded-br-md"
                          : "bg-white text-[var(--noir)] rounded-bl-md border border-gray-100 shadow-sm"}`}>
                        {m.content}
                      </div>
                    </div>

                    {/* FIX #2: Product cards with link to product detail */}
                    {m.role === "assistant" && m.products && m.products.length > 0 && (
                      <div className="pl-9 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-chat-bubble">
                        {m.products.slice(0, 4).map(p => (
                          <div key={p.id}
                            className="flex gap-2.5 bg-white border border-gray-100 rounded-xl p-2.5 shadow-sm
                                       hover:border-[var(--gold)]/30 hover:shadow-md transition-all group/card">
                            <Link to={`/product/${p.id}`} className="flex-shrink-0">
                              <img src={p.imageUrl || PLACEHOLDER_IMG} alt={p.name}
                                className="w-14 h-14 rounded-lg object-cover group-hover/card:scale-105 transition-transform"
                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-[var(--gold-dark)] uppercase tracking-wider">
                                {p.category}{p.brand ? ` · ${p.brand}` : ""}
                              </p>
                              <Link to={`/product/${p.id}`}
                                className="text-xs font-semibold text-[var(--noir)] truncate block mt-0.5
                                           hover:text-[var(--gold-dark)] transition-colors">
                                {p.name}
                              </Link>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-sm font-bold text-[var(--gold-dark)]">{p.price.toFixed(0)} RON</span>
                                {p.inStock ? (
                                  <button onClick={() => handleAddToCart(p)}
                                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider
                                               btn-luxury hover:shadow-md transition-all">
                                    + Cos
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-red-400">Epuizat</span>
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
                {chatLoading && (
                  <div className="flex items-start gap-2 animate-chat-bubble">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)]
                                    flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#1A1A1A">
                        <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-[11px] text-gray-400 font-light">{typingMsg}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FIX #1: Follow-up chips pass text directly */}
                {!chatLoading && chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === "assistant" && (
                  <div className="flex flex-wrap gap-2 pl-9">
                    {["Arata-mi mai multe", "Ai ceva mai ieftin?", "Si pentru el?"].map(s => (
                      <button key={s}
                        onClick={() => void sendChatMessage(s)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-[var(--gold)]/20
                                   text-[var(--gold-dark)] hover:bg-[var(--gold)]/10 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Category bar ──────────────────────────────────────────── */}
      <CategoryBar active={productStore.activeCategory} onChange={(cat) => productStore.setCategory(cat)} />

      {/* ── Product catalog ───────────────────────────────────────── */}
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif font-bold text-[var(--noir)]">
              {productStore.activeCategory === "all" ? "Toate Produsele" : productStore.activeCategory}
            </h2>
            {productStore.totalElements > 0 && (
              <span className="text-sm text-gray-400 font-light">({productStore.totalElements})</span>
            )}
          </div>

          <div ref={searchWrapperRef} className="relative w-full sm:w-72">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2
                            focus-within:border-[var(--gold)]/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Cauta produse..." className="grow outline-none bg-transparent text-sm font-light"
                value={localSearch}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalSearch(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} />
              {localSearch && (
                <button className="text-gray-400 hover:text-gray-600 text-xs"
                  onClick={() => { clearSearch(); setSuggestions([]); setShowSuggestions(false); }}>✕</button>
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden max-h-80 overflow-y-auto">
                {suggestions.map((p) => (
                  <button key={p.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--cream)] transition-colors text-left"
                    onClick={() => { setLocalSearch(p.name); setShowSuggestions(false); }}>
                    <img src={p.imageUrl || PLACEHOLDER_IMG} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--noir)] truncate">{p.name}</p>
                      {p.brand && <p className="text-[10px] text-gray-400">{p.brand}</p>}
                    </div>
                    <span className="text-xs font-bold text-[var(--gold-dark)] flex-shrink-0">{Number(p.price).toFixed(0)} RON</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FIX #4: Loading skeleton grid */}
        {productStore.loading && productStore.products.length === 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {productStore.error && <div className="alert alert-error">{productStore.error}</div>}

        {!productStore.loading && !productStore.error && productStore.products.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <h3 className="text-xl font-serif text-gray-600 mb-2">Niciun rezultat</h3>
            <p className="text-gray-400 text-sm mb-4">Nu am gasit produse pentru cautarea ta</p>
            <button onClick={clearSearch} className="text-[var(--gold-dark)] text-sm underline underline-offset-4">Reseteaza filtrele</button>
          </div>
        )}

        {productStore.products.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {productStore.products.map((p) => (
                <ProductCard key={p.id} product={p} onEdit={openEditModal} onDelete={handleDelete} />
              ))}
            </div>
            <div className="flex flex-col items-center mt-12 gap-3">
              {hasMore && (
                <button onClick={handleLoadMore} disabled={productStore.loading}
                  className="btn-luxury px-8 py-3 rounded-xl text-sm uppercase tracking-wider">
                  {productStore.loading
                    ? <span className="w-5 h-5 border-2 border-[var(--noir)] border-t-transparent rounded-full animate-spin" />
                    : "Incarca mai multe"}
                </button>
              )}
              <p className="text-xs text-gray-400 font-light">{productStore.products.length} din {productStore.totalElements} produse</p>
            </div>
          </>
        )}
      </main>

      <MainFooter />
      <ConfirmModal {...confirmModalProps} />
      <ProductModal isOpen={isModalOpen} productToEdit={selectedProduct}
        onClose={() => setIsModalOpen(false)} onSave={handleSave} />
    </div>
  );
};

export default HomePage;