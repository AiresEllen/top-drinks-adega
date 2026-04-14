"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  promotion_price: number | null;
  image_url: string | null;
  category: string | null;
  active?: boolean;
  featured?: boolean;
  badge?: string | null;
  volume?: string | null;
  display_order?: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  promotion_price: number | null;
  image_url: string | null;
  quantity: number;
  volume: string | null;
};

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("topdrinks_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem("topdrinks_cart", JSON.stringify(cart));
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar produtos:", error);
      } else {
        setProducts((data as Product[]) || []);
      }

      setLoading(false);
    }

    fetchProducts();
    setCartItems(getCart());

    // 🔥 substituição do useSearchParams
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setCategoriaSelecionada(params.get("categoria") || "");
    }
  }, []);

  function syncCart(next: CartItem[]) {
    setCartItems(next);
    saveCart(next);
  }

  function addToCart(product: Product) {
    const current = getCart();
    const existing = current.find((item) => item.id === product.id);

    let next: CartItem[];

    if (existing) {
      next = current.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    } else {
      next = [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          promotion_price: product.promotion_price,
          image_url: product.image_url,
          quantity: 1,
          volume: product.volume || null,
        },
      ];
    }

    syncCart(next);
    setToast(`${product.name} adicionado ao carrinho`);
    setCartOpen(true);

    setTimeout(() => setToast(""), 2000);
  }

  function increaseQuantity(id: string) {
    const next = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
    );
    syncCart(next);
  }

  function decreaseQuantity(id: string) {
    const next = cartItems
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item,
      )
      .filter((item) => item.quantity > 0);

    syncCart(next);
  }

  function removeItem(id: string) {
    const next = cartItems.filter((item) => item.id !== id);
    syncCart(next);
  }

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const finalPrice =
        item.promotion_price !== null
          ? Number(item.promotion_price)
          : Number(item.price);

      return acc + finalPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const term = search.toLowerCase();

      const matchSearch =
        product.name.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term) ||
        (product.volume || "").toLowerCase().includes(term);

      const matchCategory = categoriaSelecionada
        ? (product.category || "").toLowerCase() ===
          categoriaSelecionada.toLowerCase()
        : true;

      return matchSearch && matchCategory;
    });
  }, [products, search, categoriaSelecionada]);

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce(
      (acc: Record<string, Product[]>, product) => {
        const category = product.category?.trim() || "Sem categoria";

        if (!acc[category]) acc[category] = [];
        acc[category].push(product);

        return acc;
      },
      {},
    );
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Catálogo</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        Object.entries(groupedProducts).map(([cat, items]) => (
          <div key={cat} className="mb-8">
            <h2 className="text-xl font-bold text-amber-400 mb-3">{cat}</h2>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {items.map((p) => (
                <div key={p.id} className="bg-zinc-900 p-3 rounded-xl">
                  <p>{p.name}</p>
                  <p className="text-amber-400">
                    {formatCurrency(p.promotion_price ?? p.price)}
                  </p>

                  <button
                    onClick={() => addToCart(p)}
                    className="mt-2 bg-amber-400 text-black px-3 py-1 rounded"
                  >
                    Pedir
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
