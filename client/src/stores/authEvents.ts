/**
 * Lightweight event bus used to decouple auth.ts from cart/favorites/orders.
 *
 * auth.ts emits events → each store subscribes independently.
 * This breaks the circular import chain:
 *   auth → cart → products  (was circular because cart imported auth indirectly)
 */

type AuthEvent = "login" | "logout";
type Listener  = (userId?: string) => void;

const listeners: Map<AuthEvent, Set<Listener>> = new Map([
  ["login",  new Set()],
  ["logout", new Set()],
]);

export const authEvents = {
  on(event: AuthEvent, fn: Listener): () => void {
    listeners.get(event)!.add(fn);
    // Return an unsubscribe function
    return () => listeners.get(event)!.delete(fn);
  },

  emit(event: AuthEvent, userId?: string): void {
    listeners.get(event)!.forEach((fn) => fn(userId));
  },
};