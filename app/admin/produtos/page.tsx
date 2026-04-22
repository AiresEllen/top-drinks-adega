"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  slug: string;
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

type FormState = {
  id: string;
  slug: string;
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

const initialForm: FormState = {
  id: "",
  slug: "",
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

const CATEGORY_OPTIONS = [
  "Cervejas",
  "Whiskies",
  "Vodka",
  "Gin",
  "Vinhos",
  "Destilados",
  "Cachaças",
  "Tequila",
  "Licores",
  "Energéticos",
  "Refrigerantes",
  "Combos",
];
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function formatCurrency(value?: number | null) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return {
      label: "Sem estoque",
      classes: "bg-rose-100 text-rose-700",
    };
  }

  if (stock <= 3) {
    return {
      label: "Estoque crítico",
      classes: "bg-rose-100 text-rose-700",
    };
  }

  if (stock <= 8) {
    return {
      label: "Estoque baixo",
      classes: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Estoque ok",
    classes: "bg-emerald-100 text-emerald-700",
  };
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "name" && !prev.id) {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  function handleEdit(product: Product) {
    setForm({
      id: product.id,
      slug: product.slug || "",
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
      slug: form.slug ? slugify(form.slug) : slugify(form.name),
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

  async function handleToggleFeatured(id: string, currentValue: boolean) {
    const { error } = await supabase
      .from("products")
      .update({ featured: !currentValue })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alterar destaque:", error);
      alert("Erro ao alterar destaque.");
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

  const categories = useMemo(() => {
    const dynamicCategories = products
      .map((product) => product.category)
      .filter(
        (category): category is string => !!category && category.trim() !== "",
      );

    return Array.from(
      new Set([...CATEGORY_OPTIONS, ...dynamicCategories]),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const term = search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(term) ||
        (product.slug || "").toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term) ||
        (product.volume || "").toLowerCase().includes(term);

      const matchesCategory =
        categoryFilter === "todas"
          ? true
          : (product.category || "").toLowerCase() ===
            categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.active).length;
    const featured = products.filter((p) => p.featured).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 8).length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;

    return {
      total: products.length,
      active,
      featured,
      lowStock,
      outOfStock,
    };
  }, [products]);

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                Painel Administrativo
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-5xl">Produtos</h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-lg">
                Cadastre, edite, organize categorias, destaque produtos e
                controle o catálogo do site em uma tela só.
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
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
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
                  href="/admin/pedidos/arquivados"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Arquivados
                </Link>

                <Link
                  href="/admin/promocoes"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Promoções
                </Link>

                <Link
                  href="/catalogo"
                  className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-95"
                >
                  Ver site
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Total de produtos</div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Ativos no site</div>
            <div className="mt-2 text-3xl font-black text-emerald-700">
              {stats.active}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Com destaque</div>
            <div className="mt-2 text-3xl font-black text-amber-600">
              {stats.featured}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Baixo / sem estoque</div>
            <div className="mt-2 text-3xl font-black text-rose-600">
              {stats.lowStock + stats.outOfStock}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {form.id ? "Editar produto" : "Novo produto"}
              </h2>

              {form.id && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Modo edição
                </span>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Nome do produto
              </label>
              <input
                name="name"
                placeholder="Ex.: Heineken 350ml"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Slug
              </label>
              <input
                name="slug"
                placeholder="heineken-350ml"
                value={form.slug}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Categoria
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-400"
                required
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Para a nova seção, escolha <strong>Garrafas</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Volume
                </label>
                <input
                  name="volume"
                  placeholder="350ml"
                  value={form.volume}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Selo
                </label>
                <input
                  name="badge"
                  placeholder="Mais vendido"
                  value={form.badge}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Preço normal
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Preço promocional
                </label>
                <input
                  name="promotion_price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.promotion_price}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Estoque
                </label>
                <input
                  name="stock"
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Ordem
                </label>
                <input
                  name="display_order"
                  type="number"
                  placeholder="0"
                  value={form.display_order}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                URL da imagem
              </label>
              <input
                name="image_url"
                placeholder="https://..."
                value={form.image_url}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 p-3">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Importar imagem do dispositivo
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

              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Prévia"
                  className="mt-3 h-28 w-28 rounded-2xl border object-cover"
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Descrição
              </label>
              <textarea
                name="description"
                placeholder="Descrição do produto"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-4 rounded-2xl bg-slate-50 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Ativo no site
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                />
                Mais vendidos / destaque
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
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
            <div className="mb-5 flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Lista de produtos
                </h2>
                <p className="text-sm text-slate-500">
                  Aqui você organiza o que aparece no site.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <input
                  type="text"
                  placeholder="Pesquisar por nome, slug, categoria ou volume"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-slate-400"
                />

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-slate-400"
                >
                  <option value="todas">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const stockInfo = getStockStatus(product.stock);

                return (
                  <div
                    key={product.id}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100/70"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              sem img
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-slate-900">
                            {product.name}
                          </h3>

                          <p className="text-sm text-slate-500">
                            Slug: {product.slug}
                          </p>

                          <p className="text-sm text-slate-500">
                            Categoria: {product.category || "Sem categoria"}
                          </p>

                          <p className="text-sm text-slate-700">
                            Preço: {formatCurrency(product.price)}
                            {product.promotion_price
                              ? ` • Promo: ${formatCurrency(product.promotion_price)}`
                              : ""}
                            {product.volume ? ` • ${product.volume}` : ""}
                          </p>

                          <p className="text-sm text-slate-700">
                            Estoque atual:{" "}
                            <span className="font-bold">{product.stock}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:max-w-[340px] xl:justify-end">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleFeatured(product.id, product.featured)
                          }
                          className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ${
                            product.featured ? "bg-amber-500" : "bg-slate-600"
                          }`}
                        >
                          {product.featured ? "Tirar destaque" : "Destacar"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleActive(product.id, product.active)
                          }
                          className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ${
                            product.active ? "bg-emerald-600" : "bg-slate-500"
                          }`}
                        >
                          {product.active ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {product.active ? "Ativo" : "Inativo"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.featured
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {product.featured ? "Mais vendido" : "Normal"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${stockInfo.classes}`}
                      >
                        {stockInfo.label}
                      </span>

                      {product.promotion_price && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Promoção ativa
                        </span>
                      )}

                      {product.badge && (
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {product.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  Nenhum produto encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
