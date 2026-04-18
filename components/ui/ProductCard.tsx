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
    <div className="group flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={image}
          alt={name}
          className="h-32 w-full object-contain p-2.5 transition duration-300 group-hover:scale-105"
        />
      </div>

      <div>
        <h3 className="line-clamp-2 text-base font-bold leading-5 text-slate-900">
          {name}
        </h3>
        <p className="mt-1 text-xs text-slate-500">Produto em destaque</p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            Preço
          </div>
          <div className="text-xl font-black text-slate-950">
            R$ {price.toFixed(2)}
          </div>
        </div>

        <button
          onClick={() => addItem({ name, price, image })}
          className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:scale-[1.02]"
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}
