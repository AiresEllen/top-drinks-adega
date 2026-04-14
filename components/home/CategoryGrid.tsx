const categories = [
  "Cervejas",
  "Whiskies",
  "Vodkas",
  "Gins",
  "Energéticos",
  "Refrigerantes",
];

export default function CategoryGrid() {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Categorias</h2>
          <p className="text-sm text-slate-500">
            Encontre rapidamente o que você quer pedir.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {categories.map((cat) => (
          <button
            key={cat}
            className="group rounded-2xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
              Categoria
            </div>
            <div className="text-lg font-bold text-slate-900">{cat}</div>
            <div className="mt-1 text-sm text-slate-500">Ver produtos</div>
          </button>
        ))}
      </div>
    </section>
  );
}
