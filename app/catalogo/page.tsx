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
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

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

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const categoria = params.get("categoria");
      if (categoria?.trim()) {
        setSelectedCategory(categoria);
      }
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
    setCartOpen(true);
    setToast(`${product.name} adicionado ao carrinho`);

    window.setTimeout(() => {
      setToast("");
    }, 1800);
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

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        products
          .map((product) => product.category?.trim())
          .filter((category): category is string => !!category),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return ["Todos", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        term === ""
          ? true
          : product.name.toLowerCase().includes(term) ||
            (product.category || "").toLowerCase().includes(term) ||
            (product.volume || "").toLowerCase().includes(term) ||
            (product.badge || "").toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === "Todos"
          ? true
          : (product.category || "").toLowerCase() ===
            selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const finalPrice =
        item.promotion_price !== null && item.promotion_price !== undefined
          ? Number(item.promotion_price)
          : Number(item.price);

      return acc + finalPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-800 transition hover:bg-slate-200"
            >
              ←
            </Link>

            <div>
              <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
                Catálogo
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                Escolha sua bebida e finalize pelo WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative rounded-2xl bg-[#020826] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95"
          >
            Carrinho
            {cartCount > 0 && (
              <span className="ml-2 inline-flex min-w-[22px] items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-extrabold text-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6">
        <section className="mb-4 rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Buscar bebida, categoria ou volume..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
            />

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {categories.map((category) => {
                const active = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-[#020826] text-white shadow"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[28px] bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
            Carregando catálogo...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[28px] bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
            Nenhum produto encontrado.
          </div>
        ) : (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                {selectedCategory === "Todos"
                  ? "Todos os produtos"
                  : selectedCategory}
              </h2>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                {filteredProducts.length} item(ns)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const finalPrice =
                  product.promotion_price !== null &&
                  product.promotion_price !== undefined
                    ? Number(product.promotion_price)
                    : Number(product.price);

                return (
                  <article
                    key={product.id}
                    className="group min-w-0 overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative flex h-[140px] w-full items-center justify-center overflow-hidden bg-slate-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          sem imagem
                        </div>
                      )}

                      {product.badge && (
                        <span className="absolute right-2 top-2 max-w-[70%] truncate rounded-full bg-amber-100 px-2 py-1 text-[9px] font-extrabold text-amber-700 shadow-sm sm:px-2.5 sm:text-[10px]">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="line-clamp-2 min-h-[34px] text-sm font-bold text-slate-900">
                        {product.name}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {product.volume || product.category || "Produto"}
                      </p>

                      <div className="mt-3">
                        {product.promotion_price !== null &&
                          product.promotion_price !== undefined && (
                            <p className="text-xs text-slate-400 line-through">
                              {formatCurrency(Number(product.price))}
                            </p>
                          )}

                        <p className="text-lg font-black text-slate-950">
                          {formatCurrency(finalPrice)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="mt-2 w-full rounded-xl bg-[#020826] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                      >
                        Pedir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}

      <div
        className={`fixed inset-0 z-40 bg-black/45 transition ${
          cartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setCartOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Seu carrinho
            </h2>
            <p className="text-sm text-slate-500">{cartCount} item(ns)</p>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cartItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
              Seu carrinho está vazio.
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => {
                const finalPrice =
                  item.promotion_price !== null &&
                  item.promotion_price !== undefined
                    ? Number(item.promotion_price)
                    : Number(item.price);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                            sem img
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.volume || "Produto"}
                        </p>
                        <p className="mt-2 text-sm font-extrabold text-slate-950">
                          {formatCurrency(finalPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-900"
                        >
                          -
                        </button>

                        <span className="min-w-[26px] text-center text-sm font-bold text-slate-900">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-900"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-2xl font-extrabold text-slate-950">
              {formatCurrency(cartTotal)}
            </span>
          </div>

          <Link
            href="/checkout"
            onClick={() => setCartOpen(false)}
            className={`block rounded-2xl px-5 py-3 text-center font-extrabold transition ${
              cartItems.length === 0
                ? "pointer-events-none bg-slate-200 text-slate-400"
                : "bg-[#020826] text-white hover:opacity-95"
            }`}
          >
            Ir para checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
