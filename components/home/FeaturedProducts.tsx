"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "../cart/cartStore";
import { supabase } from "../../app/lib/supabase";

type Product = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
};

type Props = {
  onlyCatalog?: boolean;
};

export default function FeaturedProducts({ onlyCatalog = false }: Props) {
  const addItem = useCartStore((state) => state.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, image_url, price, stock, is_active, is_featured",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar produtos:", error.message);
        setLoading(false);
        return;
      }

      setProducts((data || []) as Product[]);
      setLoading(false);
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">
            {onlyCatalog ? "Catálogo" : "Mais vendidos"}
          </h2>
          <p className="mt-2 text-slate-500">Carregando produtos...</p>
        </div>
      </section>
    );
  }

  const visibleProducts = onlyCatalog
    ? products
    : products.filter((product) => product.is_featured).slice(0, 4);

  const finalProducts =
    visibleProducts.length > 0
      ? visibleProducts
      : products.slice(0, onlyCatalog ? 100 : 4);

  return (
    <section id={onlyCatalog ? "catalogo" : undefined} className="space-y-4">
      <div>
        <h2 className="text-3xl font-black text-slate-900">
          {onlyCatalog ? "Catálogo" : "Mais vendidos"}
        </h2>
        <p className="mt-2 text-slate-500">
          {onlyCatalog
            ? "Produtos organizados para facilitar a escolha e a compra."
            : "Seleção rápida dos produtos com maior saída."}
        </p>
      </div>

      {finalProducts.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-slate-500 shadow-sm">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div
          className={
            onlyCatalog
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
              : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          }
        >
          {finalProducts.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={item.image_url || "/products/img.topdrinks.jpeg"}
                  alt={item.name}
                  className="h-44 w-full object-contain p-3 transition duration-300 group-hover:scale-105"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {onlyCatalog
                    ? item.slug
                    : item.is_featured
                      ? "Produto em destaque"
                      : "Produto selecionado"}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Preço
                  </div>
                  <div className="text-2xl font-black text-slate-950">
                    R$ {Number(item.price).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() =>
                    addItem({
                      name: item.name,
                      price: Number(item.price),
                      image: item.image_url || "/products/img.topdrinks.jpeg",
                    })
                  }
                  className="rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.03]"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
