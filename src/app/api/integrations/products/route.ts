// src/app/api/integrations/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic"; // evita cache da rota
// Service role: bypassa RLS, roda só no servidor
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const KEY = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  // 1) Auth
  if (!KEY) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET ausente no pA" },
      { status: 500 },
    );
  }
  if (req.headers.get("x-api-key") !== KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const limit = Math.min(
      200,
      Math.max(1, parseInt(sp.get("limit") || "50", 10)),
    );
    const since = sp.get("since"); // ISO — delta sync
    const onlyOn = sp.get("only_active") !== "false"; // default true

    let query = admin
      .from("produtos")
      .select(
        `
          id, titulo, descricao, preco, preco_original, estoque,
          ativo, visivel, slug, codigo_ean, ncm, peso, updated_at,
          marca:marcas ( id, nome ),
          categoria:categorias ( id, nome ),
          imagens:produto_imagens ( url, principal, ordem )
        `,
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (onlyOn) query = query.eq("ativo", true).eq("visivel", true);
    if (since) query = query.gte("updated_at", since);

    const { data, error, count } = await query;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const base = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

    const products = (data || []).map((p: any) => {
      const imgs = [...(p.imagens || [])].sort((a: any, b: any) => {
        if (a.principal && !b.principal) return -1;
        if (!a.principal && b.principal) return 1;
        return (a.ordem || 0) - (b.ordem || 0);
      });
      return {
        source_product_id: p.id,
        title: p.titulo,
        description: p.descricao,
        price: p.preco,
        compare_price: p.preco_original,
        stock: p.estoque,
        ean: p.codigo_ean,
        ncm: p.ncm,
        weight: p.peso,
        slug: p.slug,
        brand: p.marca?.nome ?? null,
        category: p.categoria?.nome ?? null,
        image_url: imgs[0]?.url ?? null,
        images: imgs.map((i: any) => i.url),
        link: p.slug
          ? `${base.startsWith("http") ? base : `https://${base}`}/produto/${p.slug}`
          : null,
        updated_at: p.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      products,
      total: count ?? 0,
      page,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      server_time: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "erro interno" },
      { status: 500 },
    );
  }
}
