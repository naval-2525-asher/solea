import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  productId: number;
  name: string;
  image: string;
  price: number;
  size: string;
  style: "tee" | "tank" | "accessory";
  quantity: number;
  // Stores all selected customisation as key→value pairs
  // e.g. { "Colour": "Blush Pink", "Text": "Hello", "Date": "2025-01-01" }
  customisation?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: number, size: string, style: string, cartKey?: string) => void;
  updateQuantity: (productId: number, size: string, style: string, quantity: number, cartKey?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// Stable key for deduplication — includes customisation JSON
export const cartItemKey = (item: Omit<CartItem, "quantity">) =>
  `${item.productId}|${item.size}|${item.style}|${JSON.stringify(item.customisation ?? {})}`;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    const key = cartItemKey(item);
    setItems((prev) => {
      const existing = prev.find((i) => cartItemKey(i) === key);
      if (existing) {
        return prev.map((i) => cartItemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number, size: string, style: string, cartKey?: string) => {
    setItems((prev) =>
      prev.filter((i) => {
        if (cartKey) return cartItemKey(i) !== cartKey;
        return !(i.productId === productId && i.size === size && i.style === style);
      })
    );
  };

  const updateQuantity = (productId: number, size: string, style: string, quantity: number, cartKey?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, style, cartKey);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        const match = cartKey ? cartItemKey(i) === cartKey : i.productId === productId && i.size === size && i.style === style;
        return match ? { ...i, quantity } : i;
      })
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
