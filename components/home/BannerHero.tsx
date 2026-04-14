import Link from "next/link";

export default function BannerHero() {
  return (
    <section className="overflow-hidden rounded-[32px] bg-slate-900 shadow-xl">
      <div className="relative min-h-[430px]">
        <img
          src="/products/img.topdrinks.jpeg"
          alt="Top Drinks"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 flex min-h-[430px] items-center px-6 py-10 md:px-10">
          <div className="max-w-2xl text-white">
            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur">
              Delivery premium
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              A sua adega online com visual moderno e entrega rápida.
            </h1>

            <p className="mt-6 max-w-xl text-base text-white/90 md:text-lg">
              Compre cervejas, whiskies, vodkas, energéticos e combos em uma
              experiência bonita, rápida e profissional.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#promocoes"
                className="rounded-2xl bg-white px-6 py-3 font-semibold text-slate-950 shadow-md transition hover:opacity-95"
              >
                Ver promoções
              </Link>

              <Link
                href="/catalogo"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Pedir agora
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
