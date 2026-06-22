import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach access token ──────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: refresh token on 401 ───────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else       resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

        // Only attempt refresh on 401, and not on auth endpoints themselves
    const isAuthEndpoint = originalRequest?.url?.includes("/api/auth/");
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // No refresh token available — force logout
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest!.headers!["Authorization"] = `Bearer ${token}`;
          return apiClient(originalRequest!);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest!._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
        const { token, refreshToken: newRefresh } = res.data;

        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", newRefresh);

        apiClient.defaults.headers["Authorization"] = `Bearer ${token}`;
        processQueue(null, token);

        originalRequest!.headers!["Authorization"] = `Bearer ${token}`;
        return apiClient(originalRequest!);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function forceLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  // Redirect to login without importing React Router (works anywhere)
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

const APIService = {
  // Products — now paginated with optional search
  getProducts: (params: { search?: string; category?: string; page?: number; size?: number }) =>
    apiClient.get("/api/products", { params }),
  getProductsBatch: (ids: number[]) => apiClient.post("/api/products/batch", ids),
  getProductById: (id: string) => apiClient.get(`/api/products/${id}`),
  createProduct:  (data: unknown)             => apiClient.post("/api/products", data),
  updateProduct:  (id: string, data: unknown) => apiClient.put(`/api/products/${id}`, data),
  deleteProduct:  (id: string)                => apiClient.delete(`/api/products/${id}`),

  // Auth
  register:     (data: unknown) => apiClient.post("/api/auth/register", data),
  login:        (data: unknown) => apiClient.post("/api/auth/login", data),
  refresh:      (data: unknown) => apiClient.post("/api/auth/refresh", data),
  logout:       ()              => apiClient.post("/api/auth/logout"),

  // My profile
  getMyProfile:    () => apiClient.get("/api/users/me"),
  updateMyProfile: (data: unknown) => apiClient.put("/api/users/me", data),

  // Users
  getUsers:       () => apiClient.get("/api/users"),
  updateUserRole: (userId: string, newRole: string) =>
    apiClient.put(`/api/users/${userId}/role`, { role: newRole }),

  // Favorites
  getFavorites:   ()                  => apiClient.get("/api/favorites"),
  addFavorite:    (productId: string) => apiClient.post(`/api/favorites/${productId}`),
  removeFavorite: (productId: string) => apiClient.delete(`/api/favorites/${productId}`),

  // Orders
  getMyOrders: ()              => apiClient.get("/api/orders"),
  checkout:    (data: unknown) => apiClient.post("/api/orders/checkout", data),
  cancelOrder: (orderId: string) => apiClient.put(`/api/orders/${orderId}/cancel`),

  getAllOrders: ()              => apiClient.get("/api/orders/all"),
  // Reviews
  getReviews:    (productId: string) => apiClient.get(`/api/reviews/${productId}`),
  getReviewStats:(productId: string) => apiClient.get(`/api/reviews/${productId}/stats`),
  createReview:  (productId: string, data: unknown) => apiClient.post(`/api/reviews/${productId}`, data),
  getReviewSummary: () => apiClient.get("/api/reviews/summary"),
  deleteReview:  (reviewId: string)  => apiClient.delete(`/api/reviews/${reviewId}`),

  // Payments (Stripe)
  getPaymentConfig:   () => apiClient.get("/api/payments/config"),
  createPaymentIntent: (data: { amount: number; email: string }) =>
    apiClient.post("/api/payments/create-intent", data),

  // Chat
  chat: (data: unknown) => apiClient.post("/api/chat", data),

  updateOrderStatus: (orderId: string, status: string) =>
    apiClient.put(`/api/orders/${orderId}/status`, { status }),
};

export default APIService;