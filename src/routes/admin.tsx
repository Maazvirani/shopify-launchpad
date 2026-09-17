import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { getAdminStats } from "@/lib/ryvora.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "RYVORA — Private Dashboard" },
      { name: "description", content: "Private RYVORA dashboard: live visitors and subscribers." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "RYVORA — Private Dashboard" },
      { property: "og:description", content: "Private dashboard for the RYVORA launch page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Stats = Awaited<ReturnType<typeof getAdminStats>>;

function AdminPage() {
  const fetchStats = useServerFn(getAdminStats);
  const [passcode, setPasscode] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const unlocked = useRef<string | null>(null);

  const load = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats({ data: { passcode: code } });
      unlocked.current = code;
      setStats(data);
    } catch {
      setError("Wrong passcode.");
      unlocked.current = null;
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (unlocked.current) void load(unlocked.current);
    }, 15_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load(passcode);
          }}
          className="w-full max-w-sm"
        >
          <h1 className="font-display text-3xl">Private dashboard</h1>
          <p className="text-eyebrow mt-2 text-muted-foreground">Enter your passcode</p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="text-eyebrow mt-6 h-12 w-full border border-input bg-transparent px-4 outline-none"
            placeholder="PASSCODE"
          />
          <button
            type="submit"
            disabled={loading}
            className="text-eyebrow mt-4 flex h-12 w-full items-center justify-center bg-primary text-primary-foreground disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
          </button>
          {error && <p className="text-eyebrow mt-4 text-destructive">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-14">
      <h1 className="font-display text-4xl">RYVORA</h1>
      <p className="text-eyebrow mt-1 text-muted-foreground">Launch dashboard</p>

      <div className="mt-10 grid grid-cols-2 gap-4">
        <div className="border border-border p-6">
          <p className="text-eyebrow text-muted-foreground">On the site right now</p>
          <p className="font-display mt-2 text-5xl">{stats.liveVisitors}</p>
        </div>
        <div className="border border-border p-6">
          <p className="text-eyebrow text-muted-foreground">Total subscribers</p>
          <p className="font-display mt-2 text-5xl">{stats.totalSubscribers}</p>
        </div>
      </div>

      <h2 className="text-eyebrow mt-12 text-muted-foreground">Emails collected</h2>
      <ul className="mt-4 divide-y divide-border border border-border">
        {stats.subscribers.length === 0 && (
          <li className="text-eyebrow p-4 text-muted-foreground">No signups yet.</li>
        )}
        {stats.subscribers.map((s) => (
          <li key={s.email} className="flex items-center justify-between gap-4 p-4 text-sm">
            <span className="truncate">{s.email}</span>
            <span className="text-eyebrow shrink-0 text-muted-foreground">
              {new Date(s.created_at).toLocaleDateString()}
              {s.shopify_customer_id ? " · in Shopify" : ""}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
