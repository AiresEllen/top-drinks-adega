"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  stock: number;
  is_active: boolean;
};

type Order = {
  id: string;
  status: string;
};

function AdminTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Painel" },
    { href: "/admin/produtos", label: "Produtos" },
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/pedidos/arquivados", label: "Arquivados" }, // 🔥 NOVO
    { href: "/admin/promocoes", label: "Promoções" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-white text-slate-950"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);

  useEffect(() => {
    async function checkUserAndLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: products } = await supabase
        .from("products")
        .select("id, name, stock, is_active")
        .eq("is_active", true)
        .order("stock", { ascending: true });

      const { data: orders } = await supabase
        .from("orders")
        .select("id, status");

      const active = (products || []).filter((p) => p.is_active).length;
      const low = (products || []).filter((p) => Number(p.stock) <= 5);

      // 🔥 NÃO CONSIDERA ARQUIVADOS
      const activeOrders = (orders || []).filter(
        (o) => (o.status || "").toLowerCase() !== "arquivado",
      );

      const pending = activeOrders.filter(
        (o) => o.status !== "entregue",
      ).length;

      setActiveProducts(active);
      setLowStock(low);
      setOrderCount(activeOrders.length);
      setPendingCount(pending);
      setLoading(false);
    }

    checkUserAndLoad();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 md:p-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 shadow-sm">
          Carregando painel...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-5 rounded-[28px] bg-gradient-to-r from-slate-950 to-slate-800 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-white/70">
                Painel administrativo
              </div>
              <h1 className="mt-2 text-4xl font-black">Top Drink&apos;s ADM</h1>
              <p className="mt-3 max-w-2xl text-white/80">
                Gestão profissional da operação, estoque, pedidos e promoções em
                um só lugar.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Sair
            </button>
          </div>

          <AdminTabs />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Pedidos</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {orderCount}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Pendentes</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {pendingCount}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Produtos ativos</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {activeProducts}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Reposição urgente</div>
            <div className="mt-2 text-3xl font-black text-rose-600">
              {lowStock.length}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Situação</h2>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                Estoque baixo para reposição
              </div>

              {lowStock.length === 0 ? (
                <div className="rounded-xl bg-white p-4 text-slate-500">
                  Nenhum produto com estoque baixo.
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      <strong>{product.name}</strong> — estoque:{" "}
                      <span className="font-bold text-rose-600">
                        {product.stock}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Ações rápidas</h2>

            <div className="mt-4 grid gap-3">
              <Link
                href="/admin/produtos"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-left font-semibold text-white"
              >
                Gerenciar produtos
              </Link>

              <Link
                href="/admin/pedidos"
                className="rounded-2xl bg-rose-600 px-5 py-3 text-left font-semibold text-white"
              >
                Ver pedidos
              </Link>

              {/* 🔥 NOVO BOTÃO */}
              <Link
                href="/admin/pedidos/arquivados"
                className="rounded-2xl bg-slate-700 px-5 py-3 text-left font-semibold text-white"
              >
                Pedidos arquivados
              </Link>

              <Link
                href="/admin/produtos?filtro=baixo-estoque"
                className="rounded-2xl bg-orange-500 px-5 py-3 text-left font-semibold text-white"
              >
                Atualizar estoque
              </Link>

              <Link
                href="/admin/promocoes"
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-left font-semibold text-white"
              >
                Criar promoções
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
