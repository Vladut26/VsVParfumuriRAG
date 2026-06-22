import { useState, useEffect, useRef, type FC, type FormEvent, type ChangeEvent, type DragEvent } from "react";
import { uploadMultiple, isCloudinaryConfigured } from "../services/cloudinary";
import type { Product } from "../stores/products";

interface FormState {
  name: string; brand: string; price: number; description: string;
  imageUrl: string; imageUrls: string[];
  stock: { quantity: number; warehouse: string };
  category: { id: string; name: string };
  features: string[];
}

interface FormErrors { name?: string; price?: string; stock?: string; imageUrl?: string; }

const CATEGORIES = [
  "Parfumuri", "Eau de Parfum", "Eau de Toilette", "Cologne", "Elixir",
  "Machiaj", "Îngrijire Ten", "Îngrijire Păr", "Îngrijire Corp", "Accesorii",
];

const defaultForm = (): FormState => ({
  name: "", brand: "", price: 0, description: "", imageUrl: "", imageUrls: [],
  stock: { quantity: 10, warehouse: "" },
  category: { name: "Parfumuri", id: crypto.randomUUID() },
  features: [],
});

interface ProductModalProps {
  isOpen: boolean; productToEdit: Product | null;
  onClose: () => void; onSave: (data: unknown) => void;
}

const ProductModal: FC<ProductModalProps> = ({ isOpen, productToEdit, onClose, onSave }) => {
  const [form, setForm]             = useState<FormState>(defaultForm());
  const [errors, setErrors]         = useState<FormErrors>({});
  const [newFeature, setNewFeature] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!productToEdit;

  useEffect(() => {
    setErrors({});
    if (productToEdit) {
      setForm({
        name:        productToEdit.name        || "",
        brand:       productToEdit.brand       || "",
        price:       Number(productToEdit.price) || 0,
        description: productToEdit.description || "",
        imageUrl:    productToEdit.imageUrl    || "",
        imageUrls:   productToEdit.imageUrls   || [],
        stock: {
          quantity:  Number(productToEdit.stock?.quantity) || 0,
          warehouse: productToEdit.stock?.warehouse || "",
        },
        category: {
          name: productToEdit.category?.name || "Parfumuri",
          id:   productToEdit.category?.id  || "auto-gen",
        },
        features: Array.isArray(productToEdit.category?.features) ? [...productToEdit.category!.features!] : [],
      });
    } else {
      setForm(defaultForm());
      setNewFeature("");
      setNewImageUrl("");
    }
  }, [productToEdit, isOpen]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name || form.name.trim().length < 3) e.name = "Minim 3 caractere.";
    if (!form.price || form.price <= 0) e.price = "Prețul trebuie să fie > 0.";
    if (form.stock.quantity < 0) e.stock = "Stocul nu poate fi negativ.";
    if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl)) e.imageUrl = "URL invalid.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addFeature = () => {
    const v = newFeature.trim();
    if (v && !form.features.includes(v)) setForm((f) => ({ ...f, features: [...f.features, v] }));
    setNewFeature("");
  };

  const addImageUrl = () => {
    const v = newImageUrl.trim();
    if (v && /^https?:\/\/.+/.test(v) && !form.imageUrls.includes(v)) {
      setForm((f) => ({
        ...f,
        imageUrls: [...f.imageUrls, v],
        imageUrl: f.imageUrl || v,  // auto-set primary if empty
      }));
    }
    setNewImageUrl("");
  };

  const removeImage = (idx: number) => {
    setForm((f) => {
      const next = f.imageUrls.filter((_, i) => i !== idx);
      return { ...f, imageUrls: next, imageUrl: next[0] || f.imageUrl };
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    if (!isCloudinaryConfigured()) {
      // Fallback: create local object URLs (won't persist, but shows preview)
      const urls = imageFiles.map(f => URL.createObjectURL(f));
      setForm(f => ({
        ...f,
        imageUrls: [...f.imageUrls, ...urls],
        imageUrl: f.imageUrl || urls[0],
      }));
      return;
    }

    setUploading(true);
    setUploadProgress("0/" + imageFiles.length);
    try {
      const results = await uploadMultiple(imageFiles, "vsv/products", (done, total) => {
        setUploadProgress(done + "/" + total);
      });
      const urls = results.map(r => r.url);
      setForm(f => ({
        ...f,
        imageUrls: [...f.imageUrls, ...urls],
        imageUrl: f.imageUrl || urls[0],
      }));
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      price: parseFloat(String(form.price)),
      stock: { quantity: parseInt(String(form.stock.quantity)) || 0, warehouse: form.stock.warehouse || "Depozit Central" },
      category: { name: form.category.name, id: form.category.id || crypto.randomUUID(), features: form.features },
    };
    delete (payload as Record<string, unknown>).features;
    onSave(payload);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-[var(--noir)]">
            {isEditMode ? "Editează Produsul" : "Adaugă Produs Nou"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center
                     text-gray-400 hover:text-[var(--noir)] hover:bg-gray-100 transition-colors text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Name */}
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">
              Nume Produs *
            </label>
            <input type="text" className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none
              ${errors.name ? "border-red-300" : "border-gray-200 focus:border-[var(--gold)]"}`}
              value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} />
            {errors.name && <span className="text-red-400 text-xs mt-1">{errors.name}</span>}
          </div>

          {/* Brand */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Brand</label>
            <input type="text" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[var(--gold)] focus:outline-none"
              value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Categorie</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[var(--gold)] focus:outline-none bg-white"
              value={form.category.name}
              onChange={(e) => set("category", { ...form.category, name: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Price + Stock */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Preț (RON) *</label>
            <input type="number" step="0.01" className={`w-full px-3 py-2.5 rounded-xl border text-sm no-spinner focus:outline-none
              ${errors.price ? "border-red-300" : "border-gray-200 focus:border-[var(--gold)]"}`}
              value={form.price} onChange={(e) => set("price", parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Stoc *</label>
            <input type="number" className={`w-full px-3 py-2.5 rounded-xl border text-sm no-spinner focus:outline-none
              ${errors.stock ? "border-red-300" : "border-gray-200 focus:border-[var(--gold)]"}`}
              value={form.stock.quantity}
              onChange={(e) => set("stock", { ...form.stock, quantity: parseInt(e.target.value) })} />
          </div>

          {/* Features */}
          <div className="col-span-2 bg-[var(--cream)] rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-2">Caracteristici</label>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Adaugă caracteristică..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[var(--gold)] focus:outline-none bg-white"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }} />
              <button type="button" onClick={addFeature}
                className="px-3 py-2 rounded-lg bg-[var(--gold)] text-[var(--noir)] text-sm font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.features.map((f, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--gold)]/10 text-[var(--gold-dark)] flex items-center gap-1.5">
                  {f}
                  <button type="button" onClick={() => setForm((s) => ({ ...s, features: s.features.filter((_, j) => j !== i) }))}
                    className="text-[var(--gold-dark)]/50 hover:text-red-500 text-xs">✕</button>
                </span>
              ))}
            </div>
          </div>

          {/* Image Upload + URLs */}
          <div className="col-span-2 bg-[var(--cream)] rounded-xl p-4">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-2">
              Imagini Produs (carousel)
            </label>

            {/* Drag & Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 mb-3 text-center cursor-pointer transition-all
                ${dragOver ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-gray-200 hover:border-[var(--gold)]/40 bg-white"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => { if (e.target.files) void handleFiles(e.target.files); e.target.value = ""; }} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--gold-dark)] font-medium">Se incarca... {uploadProgress}</span>
                </div>
              ) : (
                <>
                  <svg className="mx-auto mb-2 text-gray-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm text-gray-500">Trage imagini aici sau <span className="text-[var(--gold-dark)] font-semibold">click pentru a selecta</span></p>
                  <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WebP — max 10MB per imagine</p>
                </>
              )}
            </div>

            {/* Manual URL input (fallback) */}
            <div className="flex gap-2 mb-3">
              <input type="url" placeholder="...sau lipeste URL imagine"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[var(--gold)] focus:outline-none bg-white"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }} />
              <button type="button" onClick={addImageUrl}
                className="px-3 py-2 rounded-lg bg-[var(--gold)] text-[var(--noir)] text-sm font-bold">+</button>
            </div>
            {newImageUrl && /^https?:\/\/.+/.test(newImageUrl) && (
              <div className="mb-3 flex items-center gap-3 bg-white rounded-lg p-2 border border-dashed border-[var(--gold)]/30">
                <img src={newImageUrl} alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-xs text-gray-400 truncate flex-1">Apasa + sau Enter pentru a adauga</span>
              </div>
            )}
            {form.imageUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2
                    border-gray-200 group">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23C9A96E' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"; }} />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-[var(--gold)] text-[var(--noir)] font-bold py-0.5">
                        PRINCIPAL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {form.imageUrls.length === 0 && form.imageUrl && (
              <div className="flex gap-2">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-400 self-center">Imaginea principală existentă</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mb-1.5">Descriere</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm h-24 resize-none
                                 focus:border-[var(--gold)] focus:outline-none"
              value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm text-gray-500 hover:text-[var(--noir)] transition-colors">
              Anulează
            </button>
            <button type="submit"
              className="btn-luxury px-8 py-2.5 rounded-xl text-sm uppercase tracking-wider">
              {isEditMode ? "Salvează" : "Creează"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;