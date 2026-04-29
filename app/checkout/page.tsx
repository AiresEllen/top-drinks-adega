"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type CartItem = {
  id: string;
  name: string;
  price: number;
  promotion_price?: number | null;
  image_url?: string | null;
  quantity: number;
  volume?: string | null;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });

  useEffect(() => {
    const rawCart = localStorage.getItem("topdrinks_cart");
    if (rawCart) {
      try {
        setCartItems(JSON.parse(rawCart));
      } catch (error) {
        console.error("Erro ao ler carrinho:", error);
      }
    }
  }, []);

  function updateCart(items: CartItem[]) {
    setCartItems(items);
    localStorage.setItem("topdrinks_cart", JSON.stringify(items));
  }

  function increaseQuantity(id: string) {
    updateCart(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  function decreaseQuantity(id: string) {
    updateCart(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item,
      ),
    );
  }

  function removeItem(id: string) {
    updateCart(cartItems.filter((item) => item.id !== id));
  }

  function clearCart() {
    updateCart([]);
  }

  function clearCheckoutAfterSuccess() {
    localStorage.removeItem("topdrinks_cart");
    setCartItems([]);
    setCustomerName("");
    setPhone("");
    setStreet("");
    setNumber("");
    setNeighborhood("");
    setPaymentMethod("Pix");
    setNotes("");
  }

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const finalPrice =
        item.promotion_price !== null && item.promotion_price !== undefined
          ? Number(item.promotion_price)
          : Number(item.price);

      return acc + finalPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const deliveryFee = subtotal > 0 ? 5 : 0;
  const total = subtotal + deliveryFee;

  async function handleFinishOrder() {
    setFeedback({ type: "", message: "" });

    if (cartItems.length === 0) {
      setFeedback({ type: "error", message: "Seu carrinho está vazio." });
      return;
    }

    if (!customerName.trim()) {
      setFeedback({ type: "error", message: "Preencha o nome do cliente." });
      return;
    }

    if (!phone.trim()) {
      setFeedback({
        type: "error",
        message: "Preencha o telefone ou WhatsApp.",
      });
      return;
    }

    if (!street.trim()) {
      setFeedback({ type: "error", message: "Preencha a rua." });
      return;
    }

    if (!neighborhood.trim()) {
      setFeedback({ type: "error", message: "Preencha o bairro." });
      return;
    }

    const fullAddress = `${street}${number ? `, ${number}` : ""}${
      neighborhood ? ` - ${neighborhood}` : ""
    }`;

    const normalizedItems = cartItems.map((item) => {
      const finalPrice =
        item.promotion_price !== null && item.promotion_price !== undefined
          ? Number(item.promotion_price)
          : Number(item.price);

      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volume: item.volume || null,
        unit_price: finalPrice,
        total_price: finalPrice * item.quantity,
        image_url: item.image_url || null,
      };
    });

    const orderId = crypto.randomUUID();
    const orderCode = orderId.slice(0, 8);

    setSubmitting(true);

    const { error } = await supabase.from("orders").insert({
      id: orderId,
      customer_name: customerName,
      customer_phone: phone,
      customer_address: fullAddress,
      payment_method: paymentMethod,
      notes: notes || null,
      items: normalizedItems,
      total,
      status: "pendente",
    });

    setSubmitting(false);

    if (error) {
      console.error("Erro ao salvar pedido:", error);
      setFeedback({
        type: "error",
        message: "Erro ao salvar pedido no sistema.",
      });
      return;
    }

    const orderItemsText = normalizedItems
      .map(
        (item) =>
          `• ${item.name}${item.volume ? ` (${item.volume})` : ""} x${
            item.quantity
          } - ${formatCurrency(item.total_price)}`,
      )
      .join("\n");

    let paymentText = "";

    if (paymentMethod === "Pix") {
      paymentText =
        "Vou realizar o pagamento via Pix e enviar o comprovante por aqui.";
    }

    if (paymentMethod === "Dinheiro na entrega") {
      paymentText = "O pagamento será feito em dinheiro no momento da entrega.";
    }

    if (paymentMethod === "Crédito na entrega") {
      paymentText =
        "O pagamento será feito no cartão de crédito no momento da entrega.";
    }

    const message = `Olá, Top Drink's! Quero finalizar meu pedido:

*Pedido:* #${orderCode}
*Cliente:* ${customerName}
*Telefone:* ${phone}
*Endereço:* ${fullAddress}
*Pagamento:* ${paymentMethod}

*Itens do pedido:*
${orderItemsText}

*Subtotal:* ${formatCurrency(subtotal)}
*Entrega:* ${formatCurrency(deliveryFee)}
*Total:* ${formatCurrency(total)}

${paymentText}

*Observações:* ${notes || "Nenhuma"}
`;

    const storePhone = "5511959048246";
    const whatsappLink = `https://wa.me/${storePhone}?text=${encodeURIComponent(
      message,
    )}`;

    clearCheckoutAfterSuccess();

    setFeedback({
      type: "success",
      message: `Pedido #${orderCode} salvo com sucesso! Abrindo WhatsApp e redirecionando para o catálogo...`,
    });

    setTimeout(() => {
      window.open(whatsappLink, "_blank");
    }, 200);

    setTimeout(() => {
      router.push("/catalogo");
    }, 1800);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-500">
              Revise seu pedido e finalize
            </p>
          </div>

          <Link
            href="/catalogo"
            className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:opacity-95"
          >
            Voltar ao catálogo
          </Link>
        </div>
      </header>

      <main className="w-full px-4 py-6 sm:px-5 md:px-6">
        {feedback.message && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-4 text-sm font-medium shadow-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Seu carrinho
                  </h2>
                  <p className="text-sm text-slate-500">
                    Confira os itens antes de finalizar
                  </p>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    Limpar carrinho
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center">
                  <p className="text-slate-500">Seu carrinho está vazio.</p>
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
                        className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex gap-4">
                          <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                sem img
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {item.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {item.volume || "Produto"}
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-900">
                              {formatCurrency(finalPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-900"
                          >
                            -
                          </button>

                          <span className="min-w-[40px] text-center font-semibold text-slate-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-900"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Dados para entrega
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Preencha para salvar o pedido e enviar no WhatsApp
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Número
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                    placeholder="Número"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                    placeholder="Bairro"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Forma de pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-400"
                  >
                    <option>Pix</option>
                    <option>Dinheiro na entrega</option>
                    <option>Crédito na entrega</option>
                  </select>

                  {paymentMethod === "Pix" && (
                    <p className="mt-2 text-sm text-green-600">
                      Após o pagamento, envie o comprovante no WhatsApp.
                    </p>
                  )}

                  {paymentMethod === "Dinheiro na entrega" && (
                    <p className="mt-2 text-sm text-slate-500">
                      O pagamento será feito em dinheiro no momento da entrega.
                    </p>
                  )}

                  {paymentMethod === "Crédito na entrega" && (
                    <p className="mt-2 text-sm text-slate-500">
                      O pagamento será feito no cartão de crédito na entrega.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                  placeholder="Ex.: sem gelo, troco para 100, etc."
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Resumo</h2>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Itens</span>
                  <span>
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Entrega</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-slate-950">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishOrder}
                disabled={submitting || cartItems.length === 0}
                className={`mt-6 block w-full rounded-2xl px-5 py-4 text-center font-semibold text-white transition ${
                  submitting || cartItems.length === 0
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submitting
                  ? "Salvando pedido..."
                  : "Salvar pedido e enviar no WhatsApp"}
              </button>

              <p className="mt-3 text-xs text-slate-500">
                Após finalizar, o checkout será limpo e você volta ao catálogo.
              </p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Continuar comprando
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Volte ao catálogo para adicionar mais itens.
              </p>

              <Link
                href="/catalogo"
                className="mt-4 block rounded-2xl bg-slate-950 px-5 py-3 text-center font-semibold text-white transition hover:opacity-95"
              >
                Ir para o catálogo
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
