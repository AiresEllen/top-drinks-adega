"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type OrderRecord = {
  id: string;
  status?: string | null;
  total?: number | string | null;
  items?: any;
  created_at?: string | null;
  updated_at?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_whatsapp?: string | null;
  customer_address?: string | null;
  address?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  number?: string | null;
  payment_method?: string | null;
  payment?: string | null;
  notes?: string | null;
  observation?: string | null;
  [key: string]: any;
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

function statusClasses(status?: string | null) {
  const value = normalizeStatus(status);

  if (value === "pendente") return "bg-amber-100 text-amber-700";
  if (value === "confirmado") return "bg-blue-100 text-blue-700";
  if (value === "preparando") return "bg-violet-100 text-violet-700";
  if (value === "saiu para entrega") return "bg-cyan-100 text-cyan-700";
  if (value === "entregue") return "bg-emerald-100 text-emerald-700";
  if (value === "cancelado") return "bg-rose-100 text-rose-700";
  if (value === "arquivado") return "bg-slate-200 text-slate-700";

  return "bg-slate-200 text-slate-700";
}

function formatCurrency(value?: number | string | null) {
  const num = Number(value || 0);
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleString("pt-BR");
}

function getCustomerName(order: OrderRecord) {
  return (
    order.customer_name ||
    order.name ||
    order.client_name ||
    order.nome ||
    "Cliente não informado"
  );
}

function getCustomerPhone(order: OrderRecord) {
  return (
    order.customer_phone ||
    order.customer_whatsapp ||
    order.phone ||
    order.whatsapp ||
    order.telefone ||
    ""
  );
}

function getPaymentMethod(order: OrderRecord) {
  return (
    order.payment_method ||
    order.payment ||
    order.metodo_pagamento ||
    order.forma_pagamento ||
    "Não informado"
  );
}

function getAddress(order: OrderRecord) {
  if (order.customer_address) return order.customer_address;
  if (order.address) return order.address;

  const parts = [
    order.street,
    order.number,
    order.neighborhood,
    order.city,
    order.state,
  ].filter(Boolean);

  if (parts.length) return parts.join(", ");

  return "Endereço não informado";
}

function getObservation(order: OrderRecord) {
  return order.notes || order.observation || order.observacao || "";
}

function getItemsCount(order: OrderRecord) {
  if (Array.isArray(order.items)) return order.items.length;
  return 0;
}

function parseItems(order: OrderRecord) {
  if (Array.isArray(order.items)) return order.items;
  return [];
}

export default function PedidosArquivadosPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchArchivedOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pedidos arquivados:", error);
      alert("Não consegui carregar os pedidos arquivados.");
      setLoading(false);
      return;
    }

    const archivedOnly = ((data as OrderRecord[]) || []).filter(
      (order) => normalizeStatus(order.status) === "arquivado",
    );

    setOrders(archivedOnly);
    setLoading(false);
  }

  useEffect(() => {
    fetchArchivedOrders();
  }, []);

  async function unarchiveOrder(orderId: string) {
    try {
      setSavingId(orderId);

      const { error } = await supabase
        .from("orders")
        .update({ status: "entregue" })
        .eq("id", orderId);

      if (error) {
        console.error("Erro ao desarquivar pedido:", error);
        alert("Erro ao desarquivar pedido.");
        return;
      }

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteOrder(orderId: string) {
    const confirmar = confirm(
      "Deseja realmente excluir este pedido arquivado?",
    );
    if (!confirmar) return;

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      console.error("Erro ao excluir pedido:", error);
      alert("Erro ao excluir pedido.");
      return;
    }

    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = search.toLowerCase();

      return (
        getCustomerName(order).toLowerCase().includes(term) ||
        getCustomerPhone(order).toLowerCase().includes(term) ||
        String(order.id).toLowerCase().includes(term)
      );
    });
  }, [orders, search]);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                Painel Administrativo
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-5xl">
                Pedidos arquivados
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-lg">
                Veja os pedidos que saíram da tela principal e mantenha o painel
                mais limpo.
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
                  Pedidos ativos
                </Link>

                <Link
                  href="/admin/pedidos/arquivados"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  Arquivados
                </Link>

                <Link
                  href="/catalogo"
                  className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-95"
                >
                  Ver site
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchArchivedOrders}
              className="rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Arquivados</h2>
              <p className="text-sm text-slate-500">
                Pesquise por cliente, telefone ou id do pedido.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <input
                type="text"
                placeholder="Pesquisar pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
              />

              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {filteredOrders.length} pedido(s)
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Carregando pedidos arquivados...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Nenhum pedido arquivado encontrado.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const items = parseItems(order);

              return (
                <div
                  key={order.id}
                  className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-bold text-slate-900">
                          Pedido #{String(order.id).slice(0, 8)}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                            order.status,
                          )}`}
                        >
                          {normalizeStatus(order.status)}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-900">
                            Cliente:
                          </span>{" "}
                          {getCustomerName(order)}
                        </p>

                        <p>
                          <span className="font-semibold text-slate-900">
                            Telefone:
                          </span>{" "}
                          {getCustomerPhone(order) || "Não informado"}
                        </p>

                        <p>
                          <span className="font-semibold text-slate-900">
                            Endereço:
                          </span>{" "}
                          {getAddress(order)}
                        </p>

                        <p>
                          <span className="font-semibold text-slate-900">
                            Pagamento:
                          </span>{" "}
                          {getPaymentMethod(order)}
                        </p>

                        <p>
                          <span className="font-semibold text-slate-900">
                            Criado em:
                          </span>{" "}
                          {formatDate(order.created_at)}
                        </p>

                        {getObservation(order) && (
                          <p>
                            <span className="font-semibold text-slate-900">
                              Observação:
                            </span>{" "}
                            {getObservation(order)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 xl:w-[320px]">
                      <button
                        type="button"
                        onClick={() => unarchiveOrder(order.id)}
                        disabled={savingId === order.id}
                        className="rounded-2xl bg-slate-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        Desarquivar pedido
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteOrder(order.id)}
                        className="rounded-2xl bg-rose-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-rose-700"
                      >
                        Excluir pedido
                      </button>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Total do pedido
                        </p>
                        <p className="mt-1 text-3xl font-bold text-slate-950">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-lg font-bold text-slate-900">
                        Itens do pedido
                      </h4>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {getItemsCount(order)} item(ns)
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        Nenhum item detalhado disponível nesse pedido.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((item: any, index: number) => {
                          const itemName =
                            item?.name ||
                            item?.product_name ||
                            item?.title ||
                            "Item";
                          const itemQty =
                            item?.quantity || item?.qty || item?.amount || 1;
                          const itemPrice =
                            item?.price || item?.unit_price || item?.value || 0;

                          return (
                            <div
                              key={`${order.id}-${index}`}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <p className="font-semibold text-slate-900">
                                {itemName}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Quantidade: {itemQty}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Valor: {formatCurrency(itemPrice)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
