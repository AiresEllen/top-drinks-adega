import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";

export default function MeusPedidosPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a página inicial
            </Link>

            <h1 className="text-3xl font-black text-slate-900">Meus pedidos</h1>
            <p className="mt-2 text-slate-500">
              Acompanhe seus pedidos em tempo real
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">Pedido #1024</h2>
                  <p className="text-sm text-slate-500">05/04/2026 • 21:30</p>

                  <div className="mt-4 text-sm text-slate-600">
                    2x Heineken 350ml
                    <br />
                    1x Red Bull
                  </div>

                  <div className="mt-4 text-2xl font-black text-slate-900">
                    R$ 32.90
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 md:items-end">
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                    Em preparação
                  </span>

                  <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                    Ver detalhes
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">Pedido #1023</h2>
                  <p className="text-sm text-slate-500">04/04/2026 • 19:10</p>

                  <div className="mt-4 text-sm text-slate-600">
                    1x Smirnoff 1L
                  </div>

                  <div className="mt-4 text-2xl font-black text-slate-900">
                    R$ 34.90
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 md:items-end">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Entregue
                  </span>

                  <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                    Ver detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
