import { supabase } from "../../lib/supabase";

const produtos = [
  // GIN / ETERNITY
  { name: "Eternity Gin Pistache", category: "Garrafas" },
  { name: "Eternity Gin Strawberry", category: "Garrafas" },
  { name: "Eternity Gin Abacaxi e Hortelã", category: "Garrafas" },
  { name: "Eternity Gin Maçã Verde", category: "Garrafas" },
  { name: "Eternity Gin Watermelon", category: "Garrafas" },
  { name: "Eternity Gin Tropical Fruits", category: "Garrafas" },
  { name: "Eternity Gin Morango e Pêssego", category: "Garrafas" },

  // ROCKS
  { name: "Rock's Gin Citrus", category: "Garrafas" },
  { name: "Rock's Gin Tradicional", category: "Garrafas" },
  { name: "Rock's Gin Strawberry", category: "Garrafas" },

  // BEBIDAS DIVERSAS
  { name: "Pitu", category: "Garrafas" },
  { name: "Skol Beats Remix", category: "Garrafas" },
  { name: "Aperol", category: "Garrafas" },
  { name: "Cachaça Salinas", category: "Garrafas" },
  { name: "Paratudo", category: "Garrafas" },
  { name: "Dreher", category: "Garrafas" },
  { name: "José Cuervo Tequila", category: "Garrafas" },
  { name: "Cantinho do Vale", category: "Garrafas" },

  // WHISKY / VODKA
  { name: "Jack Daniels Fire", category: "Garrafas" },
  { name: "Jack Daniels Tradicional", category: "Garrafas" },
  { name: "Jack Daniels Apple", category: "Garrafas" },
  { name: "White Horse", category: "Garrafas" },
  { name: "Smirnoff Vodka", category: "Garrafas" },

  // GIN PREMIUM
  { name: "Beefeater London Dry", category: "Garrafas" },
  { name: "Beefeater Blackberry", category: "Garrafas" },
  { name: "Beefeater Pink Strawberry", category: "Garrafas" },
  { name: "Tanqueray London Dry", category: "Garrafas" },
  { name: "Tanqueray Royale", category: "Garrafas" },

  // OUTROS
  { name: "Campari", category: "Garrafas" },
  { name: "Ypióca", category: "Garrafas" },
  { name: "Passport Honey", category: "Garrafas" },
  { name: "Passport Selection", category: "Garrafas" },
  { name: "Malibu", category: "Garrafas" },
  { name: "Vodka Balalaika", category: "Garrafas" },

  // VINHOS
  { name: "Vinho Pérgola Tinto Suave", category: "Garrafas" },
  { name: "Vinho Pérgola Branco", category: "Garrafas" },

  // OUTROS DAS PRATELEIRAS
  { name: "Licor Golf", category: "Garrafas" },
  { name: "Jurupinga", category: "Garrafas" },
  { name: "Caneler", category: "Garrafas" },
];

export async function seedProdutos() {
  const produtosFormatados = produtos.map((p) => ({
    ...p,
    slug: p.name.toLowerCase().replace(/\s+/g, "-"),
    price: 0,
    stock: 10,
    active: true,
  }));

  const { error } = await supabase.from("products").insert(produtosFormatados);

  if (error) {
    console.error(error);
    alert("Erro ao cadastrar produtos");
  } else {
    alert("Produtos cadastrados com sucesso 🚀");
  }
}
