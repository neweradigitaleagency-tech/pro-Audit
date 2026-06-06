import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const svc = createServiceClient();
    const { data, error } = await svc.from("audits").insert({
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
    }).select("id").single();

    if (error) {
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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const svc = createServiceClient();
    const { error } = await svc.from("audits").update({
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
    }).eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
