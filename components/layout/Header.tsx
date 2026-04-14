"use client";

import Link from "next/link";
import { ShoppingCart, Martini } from "lucide-react";
import { useCartStore } from "../cart/cartStore";

export default function Header() {
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-lg">
            <Martini className="h-5 w-5" />
          </div>

          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">
              Top Drink&apos;s
            </div>
            <div className="text-xs text-slate-500">Lounge Bar Delivery</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-slate-700 transition hover:text-rose-600"
          >
            Início
          </Link>

          <Link
            href="/catalogo"
            className="text-sm font-medium text-slate-700 transition hover:text-rose-600"
          >
            Catálogo
          </Link>
        </nav>

        <button
          onClick={openCart}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
        >
          <ShoppingCart className="h-4 w-4" />
          Carrinho
          {totalItems > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
