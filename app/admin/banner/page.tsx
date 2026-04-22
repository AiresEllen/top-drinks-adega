"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type BannerRow = {
  id?: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
};

export default function AdminBannerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<BannerRow>({
    section_key: "home_banner",
    title: "",
    subtitle: "",
    image_url: "",
  });

  async function loadBanner() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("section_key", "home_banner")
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar banner:", error);
      }

      if (data) {
        setForm({
          id: data.id,
          section_key: data.section_key,
          title: data.title || "",
          subtitle: data.subtitle || "",
          image_url: data.image_url || "",
        });
      } else {
        setForm({
          section_key: "home_banner",
          title: "A sua adega online com visual moderno e entrega rápida.",
          subtitle:
            "Compre cervejas, whiskies, vodkas, energéticos e combos em uma experiência bonita, rápida e profissional.",
          image_url: "/patroas-do-gole.jpeg.jpeg",
        });
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar banner:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanner();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleImageUpload(file: File) {
    try {
      setUploading(true);

      const ext = file.name.split(".").pop() || "jpg";
      const safeExt = ext.toLowerCase();
      const fileName = `banners/banner-${Date.now()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        alert(`Erro ao enviar imagem: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage
        .from("site-assets")
        .getPublicUrl(fileName);

      setForm((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));

      alert("Imagem enviada com sucesso!");
    } catch (err) {
      console.error("Erro inesperado no upload:", err);
      alert("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  function getStoragePathFromUrl(url?: string | null) {
    if (!url) return null;

    const marker = "/storage/v1/object/public/site-assets/";
    const index = url.indexOf(marker);

    if (index === -1) return null;

    return url.slice(index + marker.length);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);

      const { data: existingBanner, error: fetchError } = await supabase
        .from("site_content")
        .select("image_url")
        .eq("section_key", "home_banner")
        .maybeSingle();

      if (fetchError) {
        console.error("Erro ao buscar banner antigo:", fetchError);
      }

      const oldImageUrl = existingBanner?.image_url || null;
      const newImageUrl = form.image_url || null;

      const payload = {
        section_key: "home_banner",
        title: form.title || null,
        subtitle: form.subtitle || null,
        image_url: newImageUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("site_content")
        .upsert(payload, { onConflict: "section_key" });

      if (error) {
        console.error("Erro ao salvar banner:", error);
        alert("Erro ao salvar banner.");
        return;
      }

      const shouldDeleteOldImage =
        oldImageUrl &&
        newImageUrl &&
        oldImageUrl !== newImageUrl &&
        oldImageUrl.includes("/storage/v1/object/public/site-assets/");

      if (shouldDeleteOldImage) {
        const oldPath = getStoragePathFromUrl(oldImageUrl);

        if (oldPath) {
          const { error: removeError } = await supabase.storage
            .from("site-assets")
            .remove([oldPath]);

          if (removeError) {
            console.error("Erro ao remover imagem antiga:", removeError);
          }
        }
      }

      alert("Banner salvo com sucesso!");
      loadBanner();
    } catch (err) {
      console.error("Erro inesperado ao salvar:", err);
      alert("Erro ao salvar banner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-fuchsia-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
            Painel Administrativo
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-5xl">
            Banner do site
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-lg">
            Troque imagem, título e subtítulo da home sem mexer no código.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Painel
            </Link>

            <Link
              href="/admin/produtos"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Produtos
            </Link>

            <Link
              href="/admin/promocoes"
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Promoções
            </Link>

            <Link
              href="/admin/banner"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
            >
              Banner
            </Link>

            <Link
              href="/"
              className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-95"
            >
              Ver home
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            Carregando banner...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <form
              onSubmit={handleSave}
              className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-900">
                Editar banner
              </h2>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Título
                </label>
                <input
                  name="title"
                  value={form.title || ""}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                  placeholder="Digite o título do banner"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Subtítulo
                </label>
                <textarea
                  name="subtitle"
                  value={form.subtitle || ""}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                  placeholder="Digite o subtítulo do banner"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  URL da imagem
                </label>
                <input
                  name="image_url"
                  value={form.image_url || ""}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                  placeholder="https://..."
                />
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Enviar imagem do banner
                </label>

                <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-3 transition hover:bg-slate-50">
                  <span className="text-sm text-slate-600">
                    {uploading ? "Enviando imagem..." : "Escolher imagem"}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar banner"}
              </button>
            </form>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Prévia</h2>

              <div className="mt-4 overflow-hidden rounded-[28px] bg-[#06070b] p-6">
                <div className="grid min-h-[420px] items-center gap-6">
                  <div>
                    <span className="inline-block rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                      Delivery Premium
                    </span>

                    <h3 className="mt-4 text-3xl font-bold leading-tight text-white">
                      {form.title || "Seu título aparecerá aqui"}
                    </h3>

                    <p className="mt-4 text-sm text-white/80">
                      {form.subtitle || "Seu subtítulo aparecerá aqui"}
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    {form.image_url ? (
                      <img
                        src={form.image_url}
                        alt="Prévia do banner"
                        className="max-h-[300px] w-full object-contain"
                      />
                    ) : (
                      <div className="rounded-2xl bg-white/10 px-6 py-10 text-sm text-white/70">
                        Sem imagem do banner
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
