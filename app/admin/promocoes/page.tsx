"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  promotion_price: number | null;
  image_url: string | null;
  category: string | null;
  badge?: string | null;
  volume?: string | null;
};

function formatCurrency(value?: number | null) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PromocoesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [promoInputs, setPromoInputs] = useState<Record<string, string>>({});

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return;
    }

    const productList = (data as Product[]) || [];
    setProducts(productList);

    const initialInputs: Record<string, string> = {};
    productList.forEach((product) => {
      initialInputs[product.id] =
        product.promotion_price !== null ? String(product.promotion_price) : "";
    });

    setPromoInputs(initialInputs);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function updatePromotion(id: string, promotion_price: number | null) {
    try {
      setSavingId(id);

      const { error } = await supabase
        .from("products")
        .update({ promotion_price })
        .eq("id", id);

      if (error) {
        console.error("Erro ao salvar promoção:", error);
        alert("Erro ao salvar promoção.");
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, promotion_price } : p)),
      );

      setPromoInputs((prev) => ({
        ...prev,
        [id]: promotion_price !== null ? String(promotion_price) : "",
      }));
    } finally {
      setSavingId(null);
    }
  }

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term) ||
        (product.volume || "").toLowerCase().includes(term)
      );
    });
  }, [products, search]);

  const totalPromotions = useMemo(() => {
    return products.filter(
      (product) =>
        product.promotion_price !== null &&
        Number(product.promotion_price) > 0 &&
        Number(product.promotion_price) < Number(product.price),
    ).length;
  }, [products]);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                Painel Administrativo
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-5xl">Promoções</h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-lg">
                Defina preços promocionais e destaque ofertas automaticamente na
                home e no catálogo.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Painel
                </Link>

                <Link
                  href="/admin/produtos"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Produtos
                </Link>

                <Link
                  href="/admin/pedidos"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Pedidos
                </Link>

                <Link
                  href="/admin/promocoes"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  Promoções
                </Link>

                <Link
                  href="/"
                  className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-95"
                >
                  Ver home
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 px-5 py-4">
              <p className="text-sm text-slate-300">Promoções ativas</p>
              <h2 className="mt-1 text-4xl font-bold text-white">
                {totalPromotions}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Gerenciar promoções
              </h2>
              <p className="text-sm text-slate-500">
                Edite o preço promocional dos produtos e remova ofertas com 1
                clique.
              </p>
            </div>

            <div className="w-full md:w-[360px]">
              <input
                type="text"
                placeholder="Buscar produto, categoria ou volume"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const hasPromotion =
              product.promotion_price !== null &&
              Number(product.promotion_price) > 0 &&
              Number(product.promotion_price) < Number(product.price);

            return (
              <div
                key={product.id}
                className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                          sem img
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {product.name}
                        </h3>

                        {hasPromotion && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                            Em promoção
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {product.category || "Sem categoria"}
                        {product.volume ? ` • ${product.volume}` : ""}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                        <span className="font-semibold text-slate-900">
                          Preço normal: {formatCurrency(product.price)}
                        </span>

                        {hasPromotion && (
                          <span className="font-semibold text-rose-600">
                            Promoção: {formatCurrency(product.promotion_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={promoInputs[product.id] ?? ""}
                      onChange={(e) =>
                        setPromoInputs((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      className="w-32 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-slate-400"
                      placeholder="Preço promo"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        updatePromotion(
                          product.id,
                          promoInputs[product.id] &&
                            Number(promoInputs[product.id]) > 0
                            ? Number(promoInputs[product.id])
                            : null,
                        )
                      }
                      className="rounded-xl bg-green-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:opacity-95 sm:text-sm"
                    >
                      Salvar
                    </button>

                    <button
                      type="button"
                      onClick={() => updatePromotion(product.id, null)}
                      className="rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:opacity-95 sm:text-sm"
                    >
                      Remover
                    </button>

                    {savingId === product.id && (
                      <span className="text-xs text-slate-500 sm:text-sm">
                        salvando...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
