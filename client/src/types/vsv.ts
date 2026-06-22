// ════════════════════════════════════════════════
//  VSV E-Commerce Platform – Shared Types
// ════════════════════════════════════════════════

export type SentimentLabel = "positive" | "negative" | "mixed";

// ── Category ──────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  slug: string;
}

// ── Product ───────────────────────────────────────────────────────────
export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: Category | null;
  averageScore: number;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  createdAt: string;
  reviewCount: number;
}

export interface ReviewRequest {
  productId: number;
  comment: string;
}

export interface ReviewResponse {
  id: number;
  productId: number;
  comment: string;
  sentimentLabel: SentimentLabel;
  sentimentScore: number;       // 1–5
  sentimentSummary: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  text: string;
}

export type SubmitStatus = "idle" | "loading" | "success" | "error";