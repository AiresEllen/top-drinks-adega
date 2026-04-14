"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("ERRO LOGIN:", error.message);
      setError(`Erro no login: ${error.message}`);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100 md:grid md:grid-cols-2">
      <section className="relative hidden md:block">
        <img
          src="/products/img.topdrinks.jpeg"
          alt="Top Drinks"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 flex h-full items-end p-10 text-white">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
              Área administrativa
            </div>
            <h1 className="text-4xl font-black">Top Drink&apos;s Admin</h1>
            <p className="mt-3 max-w-md text-white/90">
              Acesse o painel para gerenciar pedidos, produtos, promoções e
              estoque.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <img
              src="/products/img.topdrinks.jpeg"
              alt="Top Drinks"
              className="mx-auto mb-4 h-24 w-24 rounded-2xl object-cover"
            />
            <h2 className="text-3xl font-black text-slate-900">
              Entrar no painel
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Login administrativo da Top Drink&apos;s
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@gmail.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-500"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="block w-full rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 text-center font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
