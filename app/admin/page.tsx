"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  stock: number;
  active?: boolean;
  is_active?: boolean;
  category?: string | null;
};

type Order = {
  id: string;
  status?: string | null;
  total?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function AdminTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Painel" },
    { href: "/admin/produtos", label: "Produtos" },
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/pedidos/arquivados", label: "Arquivados" },
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

function normalizeStatus(status?: string | null) {
  const value = (status || "").toLowerCase().trim();

  if (!value) return "pendente";
  if (value.includes("confirm")) return "confirmado";
  if (value.includes("prepar")) return "preparando";
  if (value.includes("saiu")) return "saiu para entrega";
  if (value.includes("entreg")) return "entregue";
  if (value.includes("cancel")) return "cancelado";
  if (value.includes("arquiv")) return "arquivado";

  return value;
}

function formatCurrency(value?: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function isSameDay(dateString?: string | null) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isSameMonth(dateString?: string | null) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function checkUserAndLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, stock, active, is_active, category")
        .order("stock", { ascending: true });

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, status, total, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("Erro ao buscar produtos:", productsError);
      }

      if (ordersError) {
        console.error("Erro ao buscar pedidos:", ordersError);
      }

      const allProducts = (productsData as Product[]) || [];
      const allOrders = (ordersData as Order[]) || [];

      const activeProducts = allProducts.filter(
        (p) => p.active === true || p.is_active === true,
      );

      const low = activeProducts.filter((p) => Number(p.stock) <= 5);

      setProducts(allProducts);
      setOrders(allOrders);
      setLowStock(low);
      setLoading(false);
    }

    checkUserAndLoad();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const metrics = useMemo(() => {
    const activeOrders = orders.filter(
      (order) => normalizeStatus(order.status) !== "arquivado",
    );

    const archivedOrders = orders.filter(
      (order) => normalizeStatus(order.status) === "arquivado",
    );

    const deliveredOrders = activeOrders.filter(
      (order) => normalizeStatus(order.status) === "entregue",
    );

    const todayOrders = activeOrders.filter((order) =>
      isSameDay(order.created_at),
    );

    const deliveredToday = deliveredOrders.filter((order) =>
      isSameDay(order.created_at),
    );

    const deliveredThisMonth = deliveredOrders.filter((order) =>
      isSameMonth(order.created_at),
    );

    const revenueToday = deliveredToday.reduce(
      (acc, order) => acc + Number(order.total || 0),
      0,
    );

    const revenueMonth = deliveredThisMonth.reduce(
      (acc, order) => acc + Number(order.total || 0),
      0,
    );

    const ticketAverage =
      deliveredOrders.length > 0
        ? deliveredOrders.reduce(
            (acc, order) => acc + Number(order.total || 0),
            0,
          ) / deliveredOrders.length
        : 0;

    const pendingCount = activeOrders.filter((order) => {
      const status = normalizeStatus(order.status);
      return status !== "entregue" && status !== "cancelado";
    }).length;

    const preparingCount = activeOrders.filter(
      (order) => normalizeStatus(order.status) === "preparando",
    ).length;

    const deliveryCount = activeOrders.filter(
      (order) => normalizeStatus(order.status) === "saiu para entrega",
    ).length;

    const confirmedCount = activeOrders.filter(
      (order) => normalizeStatus(order.status) === "confirmado",
    ).length;

    return {
      totalOrders: activeOrders.length,
      archivedOrders: archivedOrders.length,
      pendingCount,
      preparingCount,
      deliveryCount,
      confirmedCount,
      deliveredCount: deliveredOrders.length,
      todayOrders: todayOrders.length,
      revenueToday,
      revenueMonth,
      ticketAverage,
      activeProducts: products.filter(
        (p) => p.active === true || p.is_active === true,
      ).length,
    };
  }, [orders, products]);

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
                Gestão profissional da operação, estoque, pedidos, faturamento e
                promoções em um só lugar.
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
            <div className="text-sm text-slate-500">Pedidos ativos</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {metrics.totalOrders}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Pendentes</div>
            <div className="mt-2 text-3xl font-black text-amber-600">
              {metrics.pendingCount}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Entregues</div>
            <div className="mt-2 text-3xl font-black text-emerald-700">
              {metrics.deliveredCount}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Arquivados</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {metrics.archivedOrders}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-emerald-50 p-5 shadow-sm ring-1 ring-emerald-100">
            <div className="text-sm text-emerald-700">Faturamento hoje</div>
            <div className="mt-2 text-3xl font-black text-emerald-900">
              {formatCurrency(metrics.revenueToday)}
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50 p-5 shadow-sm ring-1 ring-blue-100">
            <div className="text-sm text-blue-700">Faturamento do mês</div>
            <div className="mt-2 text-3xl font-black text-blue-900">
              {formatCurrency(metrics.revenueMonth)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Pedidos hoje</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {metrics.todayOrders}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Ticket médio</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {formatCurrency(metrics.ticketAverage)}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">
              Resumo operacional
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Produtos ativos</div>
                <div className="mt-1 text-2xl font-black text-slate-900">
                  {metrics.activeProducts}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Estoque baixo</div>
                <div className="mt-1 text-2xl font-black text-rose-700">
                  {lowStock.length}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Confirmados</div>
                <div className="mt-1 text-2xl font-black text-blue-700">
                  {metrics.confirmedCount}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Preparando</div>
                <div className="mt-1 text-2xl font-black text-violet-700">
                  {metrics.preparingCount}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <div className="text-sm text-slate-500">Saiu para entrega</div>
                <div className="mt-1 text-2xl font-black text-cyan-700">
                  {metrics.deliveryCount}
                </div>
              </div>
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

              <Link
                href="/admin/pedidos/arquivados"
                className="rounded-2xl bg-slate-700 px-5 py-3 text-left font-semibold text-white"
              >
                Pedidos arquivados
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

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Estoque baixo</h2>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
              Produtos para reposição
            </div>

            {lowStock.length === 0 ? (
              <div className="rounded-xl bg-white p-4 text-slate-500">
                Nenhum produto com estoque baixo.
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <strong>{product.name}</strong>
                    <div className="mt-1 text-slate-500">
                      Estoque:{" "}
                      <span className="font-bold text-rose-600">
                        {product.stock}
                      </span>
                      {product.category ? ` • ${product.category}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
