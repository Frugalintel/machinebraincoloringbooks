"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS, getUserStorageKey } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";
import { logger } from "@/lib/logger";

export type CartItem = {
  id: string | number;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  subtitle?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to get user-specific storage key
  const getCartKey = useCallback(() => {
    if (!user?.id) return STORAGE_KEYS.CART; // Fallback for guest cart
    return getUserStorageKey(STORAGE_KEYS.CART, user.id);
  }, [user?.id]);

  // Load cart when user changes or app initializes
  useEffect(() => {
    setIsMounted(true);
    
    // Wait for auth to finish loading before initializing cart
    if (authLoading) return;

    // Reload cart when user changes or first load
    if (user?.id !== currentUserId || !isInitialized) {
      setCurrentUserId(user?.id || null);
      
      const cartKey = user?.id 
        ? getUserStorageKey(STORAGE_KEYS.CART, user.id)
        : STORAGE_KEYS.CART;
      
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (e) {
          logger.error("Failed to parse cart", e);
          setItems([]);
        }
      } else {
        // If switching users, we might want to clear or merge?
        // For now, simple switch: empty if nothing saved.
        setItems([]);
      }
      setIsInitialized(true);
    }
  }, [user?.id, currentUserId, authLoading, isInitialized]);

  // Save cart when items change
  useEffect(() => {
    if (isInitialized) {
      const cartKey = getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(items));
    }
  }, [items, isInitialized, getCartKey]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string | number, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = useMemo(() => 
    items.reduce((acc, item) => acc + item.quantity, 0), 
    [items]
  );
  
  const cartTotal = useMemo(() => 
    items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
    [items]
  );

  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
  }), [items, addItem, removeItem, updateQuantity, clearCart, cartCount, cartTotal, isCartOpen]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
