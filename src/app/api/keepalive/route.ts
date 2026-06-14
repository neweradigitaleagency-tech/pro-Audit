import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const svc = createServiceClient();
    await svc.from("magasins").select("id").limit(1);
    return Response.json({ ok: true, ts: Date.now() });
  } catch {
    return Response.json({ ok: false, ts: Date.now() }, { status: 500 });
  }
}
