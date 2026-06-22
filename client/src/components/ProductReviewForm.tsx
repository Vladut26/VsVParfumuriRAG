import { useState, type FC, type FormEvent, type ChangeEvent } from "react";
import { submitReview, extractErrorMessage } from "../api/vsvApi";
import type { ReviewResponse, SentimentLabel, SubmitStatus } from "../types/vsv";

interface ProductReviewFormProps {
  productId: number;
  onReviewSubmitted?: (review: ReviewResponse) => void;
}

const SENTIMENT: Record<SentimentLabel, { label: string; cls: string; icon: string }> = {
  positive: { label: "Positive", cls: "badge-positive", icon: "😊" },
  negative: { label: "Negative", cls: "badge-negative", icon: "😞" },
  mixed:    { label: "Mixed",    cls: "badge-mixed",    icon: "😐" },
};

const ProductReviewForm: FC<ProductReviewFormProps> = ({ productId, onReviewSubmitted }) => {
  const [comment, setComment]   = useState("");
  const [status, setStatus]     = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult]     = useState<ReviewResponse | null>(null);
  const MAX = 2000;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    setResult(null);
    try {
      const review = await submitReview({ productId, comment: trimmed });
      setResult(review);
      setStatus("success");
      setComment("");
      onReviewSubmitted?.(review);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "Failed to submit review."));
      setStatus("error");
    }
  };

  const cfg = result ? (SENTIMENT[result.sentimentLabel] ?? SENTIMENT.mixed) : null;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-slate-200 mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
          Leave a Review
        </h3>
        <p className="text-xs text-slate-500">Analysed in real-time by our local AI model.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          className="w-full resize-y min-h-24 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm px-4 py-3 placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-white/7 transition-all"
          value={comment}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          placeholder="Share your experience with this product…"
          maxLength={MAX}
          disabled={status === "loading"}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600 font-mono">{comment.length}/{MAX}</span>
          <button
            type="submit"
            disabled={status === "loading" || !comment.trim()}
            className="btn btn-sm rounded-full bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-wide"
          >
            {status === "loading"
              ? <><span className="loading loading-spinner loading-xs" /> Analysing…</>
              : "Submit →"}
          </button>
        </div>
      </form>

      {status === "error" && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">
          ⚠ {errorMsg}
        </div>
      )}

      {status === "success" && result && cfg && (
        <div className="vsv-fade-up flex flex-col gap-2">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2 font-mono">
            ✓ Review submitted
          </div>
          <div className={`rounded-xl border p-4 ${cfg.cls}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{cfg.icon}</span>
              <span className="font-semibold text-sm">AI Verdict: {cfg.label}</span>
              <span className="ml-auto">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-sm ${i < result.sentimentScore ? "text-amber-400" : "text-white/15"}`}>★</span>
                ))}
              </span>
            </div>
            {result.sentimentSummary && (
              <p className="text-xs leading-relaxed opacity-75">{result.sentimentSummary}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviewForm;