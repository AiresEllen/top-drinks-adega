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

type BannerContent = {
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [banner, setBanner] = useState<BannerContent>({
    title: "A sua adega online com visual moderno e entrega rápida.",
    subtitle:
      "Compre cervejas, whiskies, vodkas, energéticos e combos em uma experiência bonita, rápida e profissional.",
    image_url: "/patroas-do-gole.jpeg.jpeg",
  });

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

    async function fetchBanner() {
      const { data, error } = await supabase
        .from("site_content")
        .select("title, subtitle, image_url")
        .eq("section_key", "home_banner")
        .single();

      if (error) {
        console.error("Erro ao buscar banner:", error);
        return;
      }

      setBanner({
        title:
          data.title ||
          "A sua adega online com visual moderno e entrega rápida.",
        subtitle:
          data.subtitle ||
          "Compre cervejas, whiskies, vodkas, energéticos e combos em uma experiência bonita, rápida e profissional.",
        image_url: data.image_url || "/patroas-do-gole.jpeg.jpeg",
      });
    }

    fetchProducts();
    fetchBanner();
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
        <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md sm:h-12 sm:w-12">
                🍸
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                  Top Drink&apos;s
                </h1>
                <p className="text-[11px] text-slate-500 sm:text-sm">
                  Lounge Bar Delivery
                </p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="relative shrink-0 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 md:px-5 md:py-3"
            >
              Carrinho
              {cartCount > 0 && (
                <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-black">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <nav className="mt-3 flex items-center justify-center gap-6 border-t border-slate-200 pt-2 md:mt-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Início
            </Link>

            <Link
              href="/catalogo"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Catálogo
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="overflow-hidden rounded-[32px] bg-[#06070b] shadow-xl">
          <div className="grid min-h-[410px] items-center gap-8 px-6 py-8 md:grid-cols-2 md:px-10 md:py-10 lg:min-h-[460px]">
            <div className="relative z-10">
              <span className="inline-block rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                Delivery Premium
              </span>

              <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-white md:text-5xl">
                {banner.title}
              </h2>

              <p className="mt-4 max-w-xl text-sm text-white/85 md:text-xl">
                {banner.subtitle}
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

            <div className="relative flex min-h-[260px] items-center justify-center">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-rose-500/10 via-transparent to-amber-400/10 blur-2xl" />

              <img
                src={banner.image_url || "/patroas-do-gole.jpeg.jpeg"}
                alt="Banner principal"
                className="relative z-10 max-h-[360px] w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] md:max-h-[420px]"
              />
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {promotionProducts.map((product) => (
                <div
                  key={product.slug}
                  className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[5/4] w-full bg-slate-100">
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

                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {product.category || "Sem categoria"}
                          {product.volume ? ` • ${product.volume}` : ""}
                        </p>
                      </div>

                      <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700">
                        Oferta
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-slate-400 line-through">
                        R$ {Number(product.price).toFixed(2)}
                      </p>

                      <p className="text-xl font-bold text-rose-600">
                        R$ {Number(product.promotion_price).toFixed(2)}
                      </p>
                    </div>

                    <Link
                      href="/catalogo"
                      className="mt-3 block rounded-2xl bg-rose-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-95"
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.map((product) => {
                const finalPrice =
                  product.promotion_price !== null
                    ? product.promotion_price
                    : product.price;

                return (
                  <div
                    key={product.slug}
                    className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="aspect-[5/4] w-full bg-slate-100">
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

                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                            {product.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {product.category || "Sem categoria"}
                            {product.volume ? ` • ${product.volume}` : ""}
                          </p>
                        </div>

                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">
                          Destaque
                        </span>
                      </div>

                      <div className="mt-3">
                        {product.promotion_price !== null && (
                          <p className="text-xs text-slate-400 line-through">
                            R$ {Number(product.price).toFixed(2)}
                          </p>
                        )}

                        <p className="text-xl font-bold text-slate-950">
                          R$ {Number(finalPrice).toFixed(2)}
                        </p>
                      </div>

                      <Link
                        href="/catalogo"
                        className="mt-3 block rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-95"
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
