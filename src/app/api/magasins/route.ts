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
    const { data, error } = await svc
      .from("magasins")
      .insert({
        name: body.name,
        type: body.type || "Autre",
        zone: body.zone || "",
      })
      .select("name, type, zone")
      .single();

    if (error) {
      if (error.message?.includes?.("duplicate")) {
        return NextResponse.json({ error: "Ce magasin existe déjà" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ store: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
