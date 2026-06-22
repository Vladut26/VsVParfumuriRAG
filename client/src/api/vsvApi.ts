// ════════════════════════════════════════════════
//  VSV API Client
// ════════════════════════════════════════════════
import axios, { AxiosError } from "axios";
import type {
  Category,
  ProductSummary,
  ProductDetail,
  ReviewRequest,
  ReviewResponse,
  ChatRequest,
  ChatResponse,
} from "../types/vsv";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// ── Typed helpers ──────────────────────────────────────────────────────

export async function getProducts(params?: {
  categoryId?: number;
  search?: string;
}): Promise<ProductSummary[]> {
  const { data } = await apiClient.get<ProductSummary[]>("/api/products", { params });
  return data;
}

export async function getProductById(id: number): Promise<ProductDetail> {
  const { data } = await apiClient.get<ProductDetail>(`/api/products/${id}`);
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/api/categories");
  return data;
}

export async function submitReview(payload: ReviewRequest): Promise<ReviewResponse> {
  const { data } = await apiClient.post<ReviewResponse>("/api/reviews", payload);
  return data;
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>("/api/chat", payload);
  return data;
}

// ── Error message extractor ────────────────────────────────────────────

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail as string | undefined;
    return detail ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}