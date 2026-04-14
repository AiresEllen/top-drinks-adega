"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotion_price: number | null;
  image_url: string | null;
  category: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
  badge: string | null;
  volume: string | null;
  display_order: number;
};

type ProductForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  promotion_price: string;
  image_url: string;
  category: string;
  stock: string;
  active: boolean;
  featured: boolean;
  badge: string;
  volume: string;
  display_order: string;
};

const initialForm: ProductForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  promotion_price: "",
  image_url: "",
  category: "",
  stock: "0",
  active: true,
  featured: false,
  badge: "",
  volume: "",
  display_order: "0",
};

export default function AdminCatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return;
    }

    setProducts((data as Product[]) || []);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleEdit(product: Product) {
    setForm({
      id: product.id,
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      promotion_price:
        product.promotion_price !== null ? String(product.promotion_price) : "",
      image_url: product.image_url || "",
      category: product.category || "",
      stock: String(product.stock ?? 0),
      active: product.active ?? true,
      featured: product.featured ?? false,
      badge: product.badge || "",
      volume: product.volume || "",
      display_order: String(product.display_order ?? 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(initialForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price || 0),
      promotion_price: form.promotion_price
        ? Number(form.promotion_price)
        : null,
      image_url: form.image_url || null,
      category: form.category || null,
      stock: Number(form.stock || 0),
      active: form.active,
      featured: form.featured,
      badge: form.badge || null,
      volume: form.volume || null,
      display_order: Number(form.display_order || 0),
    };

    let error = null;

    if (form.id) {
      const response = await supabase
        .from("products")
        .update(payload)
        .eq("id", form.id);

      error = response.error;
    } else {
      const response = await supabase.from("products").insert(payload);
      error = response.error;
    }

    setLoading(false);

    if (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto.");
      return;
    }

    alert(
      form.id
        ? "Produto atualizado com sucesso!"
        : "Produto criado com sucesso!",
    );
    resetForm();
    fetchProducts();
  }

  async function handleDelete(id: string) {
    const confirmar = confirm("Deseja realmente excluir este produto?");
    if (!confirmar) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto.");
      return;
    }

    fetchProducts();
  }

  async function handleToggleActive(id: string, currentValue: boolean) {
    const { error } = await supabase
      .from("products")
      .update({ active: !currentValue })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status.");
      return;
    }

    fetchProducts();
  }

  async function handleImageUpload(file: File) {
    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        alert("Erro ao enviar imagem.");
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setForm((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));

      alert("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      alert("Erro no upload da imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                Painel Administrativo
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-5xl">
                Catálogo do Site
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-lg">
                Cadastre, edite e organize os produtos que aparecem no catálogo
                público da Top Drink&apos;s.
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
                  href="/admin/pedidos"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Pedidos
                </Link>

                <Link
                  href="/admin/promocoes"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Promoções
                </Link>

                <Link
                  href="/admin/catalogo"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  Catálogo
                </Link>
              </div>
            </div>

            <div>
              <Link
                href="/admin"
                className="inline-flex rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                Voltar
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {form.id ? "Editar produto" : "Novo produto"}
              </h2>

              {form.id && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Modo edição
                </span>
              )}
            </div>

            <input
              name="name"
              placeholder="Nome do produto"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              required
            />

            <textarea
              name="description"
              placeholder="Descrição"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              rows={3}
            />

            <input
              name="category"
              placeholder="Categoria"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                name="volume"
                placeholder="Volume"
                value={form.volume}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              />

              <input
                name="badge"
                placeholder="Selo"
                value={form.badge}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Preço"
                value={form.price}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
                required
              />

              <input
                name="promotion_price"
                type="number"
                step="0.01"
                placeholder="Preço promocional"
                value={form.promotion_price}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                name="stock"
                type="number"
                placeholder="Estoque"
                value={form.stock}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              />

              <input
                name="display_order"
                type="number"
                placeholder="Ordem"
                value={form.display_order}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-2">
              <input
                name="image_url"
                placeholder="URL da imagem"
                value={form.image_url}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-200 p-3 outline-none focus:border-slate-400"
              />

              <label className="block cursor-pointer rounded-xl border border-dashed border-neutral-300 p-3 transition hover:bg-neutral-50">
                <span className="text-sm text-slate-600">
                  {uploading
                    ? "Enviando imagem..."
                    : "Clique para enviar imagem do computador"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                />
              </label>

              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Prévia"
                  className="h-36 w-36 rounded-2xl border object-cover"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Ativo
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                />
                Destaque
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:opacity-95"
              >
                {loading
                  ? "Salvando..."
                  : form.id
                    ? "Atualizar produto"
                    : "Criar produto"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl bg-neutral-200 px-5 py-3 font-semibold text-slate-800 transition hover:bg-neutral-300"
              >
                Limpar
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Produtos cadastrados
                </h2>
                <p className="text-sm text-slate-500">
                  Esses produtos podem aparecer no catálogo do site.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {products.length} item(ns)
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
                      Sem imagem
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {product.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {product.category || "Sem categoria"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {product.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {product.badge && (
                      <div className="mt-3">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {product.badge}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-900">
                          Preço:
                        </span>{" "}
                        R$ {Number(product.price).toFixed(2)}
                      </p>

                      {product.promotion_price !== null && (
                        <p>
                          <span className="font-semibold text-rose-600">
                            Promoção:
                          </span>{" "}
                          R$ {Number(product.promotion_price).toFixed(2)}
                        </p>
                      )}

                      <p>
                        <span className="font-semibold text-slate-900">
                          Estoque:
                        </span>{" "}
                        {product.stock}
                      </p>

                      {product.volume && (
                        <p>
                          <span className="font-semibold text-slate-900">
                            Volume:
                          </span>{" "}
                          {product.volume}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(product.id, product.active)
                        }
                        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        {product.active ? "Desativar" : "Ativar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="rounded-3xl border border-dashed border-neutral-300 p-8 text-center text-slate-500 md:col-span-2 xl:col-span-3">
                  Nenhum produto cadastrado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
