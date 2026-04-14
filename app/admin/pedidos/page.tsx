"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

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

const STATUS_OPTIONS = [
  "pendente",
  "confirmado",
  "preparando",
  "saiu para entrega",
  "entregue",
  "cancelado",
];

function normalizeStatus(status?: string | null) {
  const value = (status || "").toLowerCase().trim();

  if (!value) return "pendente";
  if (value.includes("confirm")) return "confirmado";
  if (value.includes("prepar")) return "preparando";
  if (value.includes("saiu")) return "saiu para entrega";
  if (value.includes("entreg")) return "entregue";
  if (value.includes("cancel")) return "cancelado";

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

function normalizePhoneToWhatsApp(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function buildWhatsAppLink(order: OrderRecord) {
  const phone = normalizePhoneToWhatsApp(getCustomerPhone(order));
  if (!phone) return "";

  const customerName = getCustomerName(order);
  const message =
    `Olá, ${customerName}! Seu pedido #${String(order.id).slice(0, 8)} ` +
    `saiu para entrega e em breve chegará até você. ` +
    `Top Drink's agradece pela preferência!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.type = "sine";
    oscillator1.frequency.setValueAtTime(880, ctx.currentTime);

    oscillator2.type = "triangle";
    oscillator2.frequency.setValueAtTime(660, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator1.start();
    oscillator2.start();

    oscillator1.stop(ctx.currentTime + 0.7);
    oscillator2.stop(ctx.currentTime + 0.7);
  } catch (error) {
    console.error("Erro ao tocar som:", error);
  }
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [popupOrder, setPopupOrder] = useState<OrderRecord | null>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const popupTimeoutRef = useRef<number | null>(null);

  function showNewOrderAlert(order: OrderRecord) {
    setPopupOrder(order);

    if (popupTimeoutRef.current) {
      window.clearTimeout(popupTimeoutRef.current);
    }

    playNotificationSound();

    popupTimeoutRef.current = window.setTimeout(() => {
      setPopupOrder(null);
    }, 8000);
  }

  async function fetchOrders(showAlertForNew = false) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      if (!initializedRef.current) {
        alert("Não consegui carregar os pedidos.");
      }
      setLoading(false);
      return;
    }

    const nextOrders = (data as OrderRecord[]) || [];
    const currentIds = new Set(nextOrders.map((order) => String(order.id)));

    if (!initializedRef.current) {
      seenIdsRef.current = currentIds;
      initializedRef.current = true;
      setOrders(nextOrders);
      setLoading(false);
      return;
    }

    if (showAlertForNew) {
      const newest = nextOrders.find(
        (order) => !seenIdsRef.current.has(String(order.id)),
      );

      if (newest) {
        showNewOrderAlert(newest);
      }
    }

    seenIdsRef.current = currentIds;
    setOrders(nextOrders);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders(false);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as OrderRecord;

          setOrders((prev) => {
            const exists = prev.some(
              (order) => String(order.id) === String(newOrder.id),
            );
            if (exists) return prev;
            return [newOrder, ...prev];
          });

          if (!seenIdsRef.current.has(String(newOrder.id))) {
            seenIdsRef.current.add(String(newOrder.id));
            showNewOrderAlert(newOrder);
          }
        },
      )
      .subscribe();

    const interval = window.setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);

      if (popupTimeoutRef.current) {
        window.clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      setSavingId(orderId);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao atualizar status do pedido.");
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
    } finally {
      setSavingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = getCustomerName(order).toLowerCase();
      const customerPhone = getCustomerPhone(order).toLowerCase();
      const status = normalizeStatus(order.status);
      const id = String(order.id).toLowerCase();

      const matchesSearch =
        customerName.includes(search.toLowerCase()) ||
        customerPhone.includes(search.toLowerCase()) ||
        id.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ? true : status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => normalizeStatus(order.status) === "pendente",
    ).length;

    const preparing = orders.filter(
      (order) => normalizeStatus(order.status) === "preparando",
    ).length;

    const delivery = orders.filter(
      (order) => normalizeStatus(order.status) === "saiu para entrega",
    ).length;

    const completed = orders.filter(
      (order) => normalizeStatus(order.status) === "entregue",
    ).length;

    return {
      total: orders.length,
      pending,
      preparing,
      delivery,
      completed,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                Painel Administrativo
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-5xl">Pedidos</h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-lg">
                Acompanhe os pedidos, atualize status e organize a operação com
                mais agilidade.
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
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  Pedidos
                </Link>

                <Link
                  href="/admin/promocoes"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Promoções
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
              onClick={() => fetchOrders(false)}
              className="rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              Atualizar pedidos
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de pedidos</p>
            <h2 className="mt-2 text-4xl font-bold text-slate-900">
              {stats.total}
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendentes</p>
            <h2 className="mt-2 text-4xl font-bold text-amber-600">
              {stats.pending}
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Preparando / entrega</p>
            <h2 className="mt-2 text-4xl font-bold text-blue-700">
              {stats.preparing + stats.delivery}
            </h2>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Concluídos</p>
            <h2 className="mt-2 text-4xl font-bold text-emerald-700">
              {stats.completed}
            </h2>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Gerenciar pedidos
              </h2>
              <p className="text-sm text-slate-500">
                Pesquise por cliente, telefone ou id do pedido.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <input
                type="text"
                placeholder="Pesquisar pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-400"
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="preparando">Preparando</option>
                <option value="saiu para entrega">Saiu para entrega</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Carregando pedidos...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              Nenhum pedido encontrado.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const items = parseItems(order);
              const whatsappLink = buildWhatsAppLink(order);
              const normalized = normalizeStatus(order.status);

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
                          {normalized}
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
                      <label className="text-sm font-semibold text-slate-800">
                        Atualizar status
                      </label>

                      <select
                        value={normalized}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value)
                        }
                        disabled={savingId === order.id}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-400"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">
                          Total do pedido
                        </p>
                        <p className="mt-1 text-3xl font-bold text-slate-950">
                          {formatCurrency(order.total)}
                        </p>
                      </div>

                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-green-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-700"
                        >
                          Avisar pelo WhatsApp
                        </a>
                      ) : (
                        <div className="rounded-2xl bg-slate-100 px-5 py-3 text-center text-sm text-slate-500">
                          Telefone não disponível para WhatsApp
                        </div>
                      )}
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

      {popupOrder && (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-3xl border border-emerald-200 bg-white p-5 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Novo pedido
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">
            Pedido #{String(popupOrder.id).slice(0, 8)}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Cliente: {getCustomerName(popupOrder)}
          </p>
          <p className="text-sm text-slate-600">
            Total: {formatCurrency(popupOrder.total)}
          </p>

          <button
            type="button"
            onClick={() => setPopupOrder(null)}
            className="mt-4 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
