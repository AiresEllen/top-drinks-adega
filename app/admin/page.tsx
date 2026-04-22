"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "melxluki34@gmail.com";

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

function AdminTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Painel" },
    { href: "/admin/produtos", label: "Produtos" },
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/pedidos/arquivados", label: "Arquivados" },
    { href: "/admin/promocoes", label: "Promoções" },
    { href: "/admin/banner", label: "Banner" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const userEmail = user.email?.toLowerCase().trim();

      if (userEmail !== ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        router.replace("/login");
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

      setProducts((productsData as Product[]) || []);
      setOrders((ordersData as Order[]) || []);
      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const stats = useMemo(() => {
    const activeProducts = products.filter(
      (p) => p.active === true || p.is_active === true,
    );

    const lowStock = activeProducts.filter(
      (p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5,
    );

    const outOfStock = activeProducts.filter((p) => Number(p.stock || 0) <= 0);

    const bottleProducts = activeProducts.filter(
      (p) => (p.category || "").toLowerCase() === "garrafas",
    );

    const activeOrders = orders.filter(
      (order) => normalizeStatus(order.status) !== "arquivado",
    );

    const deliveredOrders = activeOrders.filter(
      (order) => normalizeStatus(order.status) === "entregue",
    );

    const pendingOrders = activeOrders.filter((order) => {
      const status = normalizeStatus(order.status);
      return (
        status === "pendente" ||
        status === "confirmado" ||
        status === "preparando" ||
        status === "saiu para entrega"
      );
    });

    const ordersToday = activeOrders.filter((order) =>
      isSameDay(order.created_at),
    );

    const revenueToday = deliveredOrders
      .filter((order) => isSameDay(order.created_at))
      .reduce((acc, order) => acc + Number(order.total || 0), 0);

    const revenueMonth = deliveredOrders
      .filter((order) => isSameMonth(order.created_at))
      .reduce((acc, order) => acc + Number(order.total || 0), 0);

    return {
      activeProductsCount: activeProducts.length,
      lowStock,
      outOfStock,
      bottleProductsCount: bottleProducts.length,
      activeOrdersCount: activeOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      pendingOrdersCount: pendingOrders.length,
      ordersTodayCount: ordersToday.length,
      revenueToday,
      revenueMonth,
    };
  }, [orders, products]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 shadow-sm">
          Carregando painel...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                Painel Administrativo
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-5xl">
                Painel ADM
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-lg">
                Acompanhe pedidos, faturamento, estoque e os principais atalhos
                do sistema em uma tela mais organizada.
              </p>

              <div className="mt-6">
                <AdminTabs />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-300">Faturamento hoje</p>
                <h2 className="mt-1 text-3xl font-bold">
                  {formatCurrency(stats.revenueToday)}
                </h2>
              </div>

              <div className="rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-300">Faturamento do mês</p>
                <h2 className="mt-1 text-3xl font-bold">
                  {formatCurrency(stats.revenueMonth)}
                </h2>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pedidos ativos</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              {stats.activeOrdersCount}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pedidos hoje</p>
            <h2 className="mt-2 text-3xl font-black text-blue-700">
              {stats.ordersTodayCount}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Entregues</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-700">
              {stats.deliveredOrdersCount}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendentes / em andamento</p>
            <h2 className="mt-2 text-3xl font-black text-amber-600">
              {stats.pendingOrdersCount}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Produtos ativos</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              {stats.activeProductsCount}
            </h2>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Ações rápidas
                </h2>
                <p className="text-sm text-slate-500">
                  Atalhos principais do painel.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-2xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
              >
                Sair
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Link
                href="/admin/produtos"
                className="rounded-2xl bg-slate-950 px-5 py-4 text-white transition hover:opacity-95"
              >
                <div className="text-sm text-white/70">Cadastro e edição</div>
                <div className="mt-1 text-lg font-bold">Produtos</div>
              </Link>

              <Link
                href="/admin/pedidos"
                className="rounded-2xl bg-rose-600 px-5 py-4 text-white transition hover:opacity-95"
              >
                <div className="text-sm text-white/75">Operação diária</div>
                <div className="mt-1 text-lg font-bold">Pedidos</div>
              </Link>

              <Link
                href="/admin/promocoes"
                className="rounded-2xl bg-emerald-600 px-5 py-4 text-white transition hover:opacity-95"
              >
                <div className="text-sm text-white/75">Ofertas</div>
                <div className="mt-1 text-lg font-bold">Promoções</div>
              </Link>

              <Link
                href="/admin/banner"
                className="rounded-2xl bg-fuchsia-600 px-5 py-4 text-white transition hover:opacity-95"
              >
                <div className="text-sm text-white/75">Visual do site</div>
                <div className="mt-1 text-lg font-bold">Editar banner</div>
              </Link>

              <Link
                href="/admin/pedidos/arquivados"
                className="rounded-2xl bg-slate-700 px-5 py-4 text-white transition hover:opacity-95"
              >
                <div className="text-sm text-white/75">Histórico</div>
                <div className="mt-1 text-lg font-bold">Arquivados</div>
              </Link>

              <Link
                href="/"
                className="rounded-2xl bg-amber-400 px-5 py-4 text-slate-950 transition hover:brightness-95"
              >
                <div className="text-sm text-slate-700">Visualização</div>
                <div className="mt-1 text-lg font-bold">Ver site</div>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Resumo operacional
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Indicadores rápidos para tomada de decisão.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Garrafas cadastradas</p>
                <h3 className="mt-1 text-2xl font-black text-fuchsia-700">
                  {stats.bottleProductsCount}
                </h3>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estoque baixo</p>
                <h3 className="mt-1 text-2xl font-black text-amber-600">
                  {stats.lowStock.length}
                </h3>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Sem estoque</p>
                <h3 className="mt-1 text-2xl font-black text-rose-600">
                  {stats.outOfStock.length}
                </h3>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Pedidos entregues</p>
                <h3 className="mt-1 text-2xl font-black text-emerald-700">
                  {stats.deliveredOrdersCount}
                </h3>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Estoque baixo
              </h2>
              <p className="text-sm text-slate-500">
                Produtos que precisam de atenção rápida.
              </p>
            </div>

            {stats.lowStock.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Nenhum produto com estoque baixo no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStock.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {product.category || "Sem categoria"}
                      </p>
                    </div>

                    <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                      {product.stock} un.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Sem estoque</h2>
              <p className="text-sm text-slate-500">
                Produtos zerados no sistema.
              </p>
            </div>

            {stats.outOfStock.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Nenhum produto zerado no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.outOfStock.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {product.category || "Sem categoria"}
                      </p>
                    </div>

                    <div className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                      0 un.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
