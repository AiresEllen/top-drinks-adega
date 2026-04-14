"use client";

import { useCartStore } from "../cart/cartStore";

type Props = {
  name: string;
  price: number;
  image: string;
};

export default function ProductCard({ name, price, image }: Props) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="group flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={image}
          alt={name}
          className="h-40 w-full object-contain p-3 transition duration-300 group-hover:scale-105"
        />
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">{name}</h3>
        <p className="mt-1 text-sm text-slate-500">Produto em destaque</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Preço
          </div>
          <div className="text-2xl font-black text-slate-950">
            R$ {price.toFixed(2)}
          </div>
        </div>

        <button
          onClick={() => addItem({ name, price, image })}
          className="rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.03]"
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}
