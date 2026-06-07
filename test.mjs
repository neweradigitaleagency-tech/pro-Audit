import { createClient } from "@supabase/supabase-js";

const URL = "https://pomtblquzxygsublbbsd.supabase.co";
const SVC = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbXRibHF1enh5Z3N1YmxiYnNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc3Mzc1NCwiZXhwIjoyMDk2MzQ5NzU0fQ.G3N1Ct3PhlKEO-boqBXela-Sh6ZttjM6rg5g9EaqfsA";

const svc = createClient(URL, SVC);

const endpoints = [
  URL + "/rest/v1/rpc/exec_sql",
  URL + "/rest/v1/rpc/exec",
  URL + "/rest/v1/rpc/execute_sql",
  URL + "/rest/v1/rpc/sql",
  URL + "/pg/v1/sql",
  URL + "/api/v1/sql",
];

for (const url of endpoints) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "apikey": SVC, "Authorization": "Bearer " + SVC, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "SELECT 1" })
    });
    const txt = await res.text();
    if (res.status !== 404 && res.status !== 405) {
      console.log("FOUND:", url, res.status, txt.substring(0, 200));
    }
  } catch(e) {}
}
console.log("Done scanning");
