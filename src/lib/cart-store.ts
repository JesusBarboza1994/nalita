"use client";

import { useSyncExternalStore } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "nalita3d-cart";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    items = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function persist(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage no disponible: el carrito vive sólo en memoria */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return items;
}

export const cart = {
  add(item: Omit<CartItem, "key" | "quantity">, quantity = 1) {
    load();
    const key = `${item.productId}:${item.variantId}`;
    const existing = items.find((i) => i.key === key);
    persist(
      existing
        ? items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
        : [...items, { ...item, key, quantity }],
    );
  },
  setQuantity(key: string, quantity: number) {
    load();
    persist(
      quantity <= 0
        ? items.filter((i) => i.key !== key)
        : items.map((i) => (i.key === key ? { ...i, quantity } : i)),
    );
  },
  remove(key: string) {
    load();
    persist(items.filter((i) => i.key !== key));
  },
  clear() {
    persist(EMPTY);
  },
};

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const count = current.reduce((n, i) => n + i.quantity, 0);
  const subtotal = current.reduce((n, i) => n + i.price * i.quantity, 0);
  return { items: current, count, subtotal };
}
