"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../app/lib/supabase";

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  highlight_text: string | null;
  is_active: boolean;
};

export default function PromoSection() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromotions() {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setPromotions((data || []) as Promotion[]);
      setLoading(false);
    }

    loadPromotions();
  }, []);

  return (
    <section id="promocoes" className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Promoções</h2>
        <p className="text-sm text-slate-500">
          Campanhas e ofertas criadas direto do painel
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-slate-500">
          Carregando promoções...
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl bg-yellow-50 p-6 shadow-sm">
          <div className="text-lg font-black text-slate-900">Promoção</div>
          <p className="mt-2 text-slate-700">
            Crie promoções no painel administrativo para elas aparecerem aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 p-6 text-white shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
                {promo.badge || "Promoção especial"}
              </div>

              <h3 className="text-2xl font-black">{promo.title}</h3>

              {promo.description && (
                <p className="mt-2 text-white/90">{promo.description}</p>
              )}

              {promo.highlight_text && (
                <div className="mt-4 rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold">
                  {promo.highlight_text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
