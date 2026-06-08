import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const svc = createServiceClient();
    const payload: Record<string, unknown> = {
      user_id: session.user.id,
      magasin_name: body.magasin_name,
      superviseur: body.superviseur,
      responsable: body.responsable,
      date: body.date,
      heure: body.heure,
      results: body.results || {},
      custom_items: body.custom_items || {},
      counts: body.counts || { S: 0, M: 0, NS: 0, NA: 0 },
      score: body.score ?? 0,
      status: body.status || "final",
    };
    let ref: string | null = null;
    if (payload.status === "final") {
      ref = await generateRef(svc, body.magasin_name as string, body.date as string);
      payload.ref = ref;
    }
    const { data, error } = await svc.from("audits").insert(payload).select("id").single();

    if (error) {
      if (ref && error.message?.includes?.("ref")) {
        delete payload.ref;
        const { data: retry, error: retryErr } = await svc.from("audits").insert(payload).select("id").single();
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 400 });
        return NextResponse.json({ id: retry.id });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 })

    const svc = createServiceClient()
    const { data: audit, error } = await svc
      .from("audits")
      .select("id, magasin_name, superviseur, responsable, date, heure, results, custom_items, status")
      .eq("id", id)
      .single()

    if (error || !audit) return NextResponse.json({ error: "Audit introuvable" }, { status: 404 })
    return NextResponse.json(audit)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const svc = createServiceClient();
    const updates: Record<string, unknown> = {
      magasin_name: body.magasin_name,
      superviseur: body.superviseur,
      responsable: body.responsable,
      date: body.date,
      heure: body.heure,
      results: body.results || {},
      custom_items: body.custom_items || {},
      counts: body.counts || { S: 0, M: 0, NS: 0, NA: 0 },
      score: body.score ?? 0,
      status: body.status || "final",
    };
    let ref: string | null = null;
    if (updates.status === "final") {
      try {
        const { data: existing } = await svc.from("audits").select("ref").eq("id", body.id).single();
        if (!existing?.ref) {
          ref = await generateRef(svc, body.magasin_name as string, body.date as string);
          updates.ref = ref;
        } else {
          ref = existing.ref;
        }
      } catch { /* column may not exist yet */ }
    }
    const { error } = await svc.from("audits").update(updates).eq("id", body.id);

    if (error) {
      if (ref && error.message?.includes?.("ref")) {
        delete updates.ref;
        const { error: retryErr } = await svc.from("audits").update(updates).eq("id", body.id);
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 400 });
        return NextResponse.json({ ok: true, ref: null });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ref });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

function magasinSlug(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toUpperCase().replace(/[^A-Z]/g, "")
}

async function generateRef(svc: SupabaseClient, magasinName: string, date: string): Promise<string> {
  const slug = magasinSlug(magasinName)
  const dateKey = date.replace(/-/g, "")
  const { count } = await svc
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("magasin_name", magasinName)
    .eq("date", date)
  const seq = String(((count as number) || 0) + 1).padStart(3, "0")
  return `${slug}-${dateKey}-${seq}`
}
