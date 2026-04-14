"use client";

import Link from "next/link";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCartStore } from "./cartStore";

export default function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={closeCart} />

      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Seu carrinho</h2>
            <p className="text-sm text-slate-500">
              Revise os itens antes de finalizar
            </p>
          </div>

          <button
            onClick={closeCart}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Seu carrinho está vazio.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      R$ {item.price.toFixed(2)}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseItem(item.name)}
                          className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="min-w-[24px] text-center font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseItem(item.name)}
                          className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.name)}
                        className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Subtotal</span>
            <span className="text-2xl font-black text-slate-950">
              R$ {subtotal.toFixed(2)}
            </span>
          </div>

          {items.length > 0 ? (
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 text-center font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Finalizar pedido
            </Link>
          ) : (
            <button
              disabled
              className="w-full rounded-2xl bg-slate-300 px-5 py-3 font-semibold text-white"
            >
              Finalizar pedido
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
