"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  promotion_price: number | null;
  image_url: string | null;
  category: string | null;
  active: boolean;
  featured: boolean;
  badge: string | null;
  volume: string | null;
  display_order: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  promotion_price?: number | null;
  image_url?: string | null;
  quantity: number;
  volume?: string | null;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

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
  }, []);

  useEffect(() => {
    function syncCartCount() {
      try {
        const rawCart = localStorage.getItem("topdrinks_cart");
        const cart: CartItem[] = rawCart ? JSON.parse(rawCart) : [];
        const totalItems = cart.reduce(
          (acc, item) => acc + Number(item.quantity || 0),
          0,
        );
        setCartCount(totalItems);
      } catch (error) {
        console.error("Erro ao ler carrinho:", error);
        setCartCount(0);
      }
    }

    syncCartCount();

    window.addEventListener("focus", syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener("focus", syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(
            (category): category is string =>
              !!category && category.trim() !== "",
          ),
      ),
    );

    return unique.slice(0, 6);
  }, [products]);

  const featuredProducts = useMemo(() => {
    return products.filter((product) => product.featured).slice(0, 4);
  }, [products]);

  const promotionProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          product.promotion_price !== null &&
          Number(product.promotion_price) > 0 &&
          Number(product.promotion_price) < Number(product.price),
      )
      .slice(0, 4);
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md">
              🍸
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Top Drink&apos;s
              </h1>
              <p className="text-sm text-slate-500">Lounge Bar Delivery</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Início
            </Link>

            <Link
              href="/catalogo"
              className="font-medium text-slate-700 hover:text-slate-900"
            >
              Catálogo
            </Link>
          </nav>

          <Link
            href="/checkout"
            className="relative rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Carrinho
            {cartCount > 0 && (
              <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-black">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="relative overflow-hidden rounded-[32px] shadow-xl">
          <img
            src="/products/img.topdrinks.jpeg"
            alt="Banner Top Drinks"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 p-6 md:p-12">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                Delivery Premium
              </span>

              <h2 className="mt-4 text-3xl font-bold leading-tight text-white md:text-6xl">
                A sua adega online com visual moderno e entrega rápida.
              </h2>

              <p className="mt-4 text-sm text-white/85 md:text-xl">
                Compre cervejas, whiskies, vodkas, energéticos e combos em uma
                experiência bonita, rápida e profissional.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#promocoes"
                  className="rounded-2xl bg-white px-5 py-3 font-semibold text-black shadow transition hover:bg-slate-100"
                >
                  Ver promoções
                </a>

                <Link
                  href="/catalogo"
                  className="rounded-2xl bg-amber-400 px-5 py-3 font-bold text-black transition hover:brightness-95"
                >
                  Pedir agora
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="promocoes" className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Promoções</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ofertas em destaque para o cliente.
              </p>
            </div>

            <Link
              href="/catalogo"
              className="hidden rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 md:inline-flex"
            >
              Ver catálogo
            </Link>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              Carregando...
            </div>
          ) : promotionProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm text-slate-500">
              Nenhuma promoção cadastrada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
              {promotionProducts.map((product) => (
                <div
                  key={product.id}
                  className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[6/5] w-full bg-slate-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 sm:p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 sm:text-base">
                          {product.name}
                        </h3>

                        <p className="mt-1 line-clamp-1 text-[11px] text-slate-500 sm:text-xs">
                          {product.category || "Sem categoria"}
                          {product.volume ? ` • ${product.volume}` : ""}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-1 text-[9px] font-bold text-rose-700 sm:px-2 sm:text-[10px]">
                        Oferta
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-slate-400 line-through">
                        R$ {Number(product.price).toFixed(2)}
                      </p>

                      <p className="text-base font-bold text-rose-600 sm:text-xl">
                        R$ {Number(product.promotion_price).toFixed(2)}
                      </p>
                    </div>

                    <Link
                      href="/catalogo"
                      className="mt-3 block rounded-2xl bg-rose-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-95 sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      Aproveitar promoção
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-slate-900">Categorias</h2>
            <p className="mt-1 text-sm text-slate-500">
              Encontre rapidamente o que você quer pedir.
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              Carregando...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm text-slate-500">
              Nenhuma categoria cadastrada ainda.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/catalogo?categoria=${encodeURIComponent(category)}`}
                  className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-500">
                    Categoria
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {category}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">Ver produtos</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="mais-vendidos" className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Mais vendidos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Produtos em destaque no catálogo.
              </p>
            </div>

            <Link
              href="/catalogo"
              className="hidden rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 md:inline-flex"
            >
              Ver todos
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm text-slate-500">
              Nenhum produto marcado como destaque ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.map((product) => {
                const finalPrice =
                  product.promotion_price !== null
                    ? product.promotion_price
                    : product.price;

                return (
                  <div
                    key={product.id}
                    className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="aspect-[6/5] w-full bg-slate-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                          Sem imagem
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 sm:p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 sm:text-base">
                            {product.name}
                          </h3>

                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-500 sm:text-xs">
                            {product.category || "Sem categoria"}
                            {product.volume ? ` • ${product.volume}` : ""}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-1 text-[9px] font-bold text-amber-700 sm:px-2 sm:text-[10px]">
                          Destaque
                        </span>
                      </div>

                      <div className="mt-3">
                        {product.promotion_price !== null && (
                          <p className="text-xs text-slate-400 line-through">
                            R$ {Number(product.price).toFixed(2)}
                          </p>
                        )}

                        <p className="text-base font-bold text-slate-950 sm:text-xl">
                          R$ {Number(finalPrice).toFixed(2)}
                        </p>
                      </div>

                      <Link
                        href="/catalogo"
                        className="mt-3 block rounded-2xl bg-slate-950 px-3 py-2 text-center text-xs font-semibold text-white transition hover:opacity-95 sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        Ver no catálogo
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
