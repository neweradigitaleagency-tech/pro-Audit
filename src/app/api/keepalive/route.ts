import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const svc = createServiceClient();
  const { error } = await svc.from("magasins").select("id").limit(1);
  return Response.json({ ok: !error, ts: Date.now() });
}
