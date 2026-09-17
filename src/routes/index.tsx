import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Instagram, Loader2 } from "lucide-react";
import { toast } from "sonner";

import fabric from "@/assets/ryvora-fabric.jpg";
import { heartbeat, subscribe } from "@/lib/ryvora.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RYVORA — Coming Soon | Designed the way you live." },
      {
        name: "description",
        content:
          "RYVORA is launching from Karachi, Pakistan. More than clothing — a lifestyle in the making. Join the list and be the first to know.",
      },
      { property: "og:title", content: "RYVORA — Coming Soon" },
      {
        property: "og:description",
        content: "More than clothing. A lifestyle in the making. Be the first to know.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComingSoon,
});

const INSTAGRAM_URL = "https://www.instagram.com/ryvora.pk";

function useVisitorHeartbeat() {
  const ping = useServerFn(heartbeat);
  const pingRef = useRef(ping);
  pingRef.current = ping;

  useEffect(() => {
    let visitorId = localStorage.getItem("ryvora-visitor-id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("ryvora-visitor-id", visitorId);
    }
    const send = () => {
      if (document.visibilityState !== "visible") return;
      void pingRef.current({ data: { visitorId: visitorId! } }).catch(() => {});
    };
    send();
    const interval = window.setInterval(send, 25_000);
    document.addEventListener("visibilitychange", send);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", send);
    };
  }, []);
}

function ComingSoon() {
  useVisitorHeartbeat();
  const join = useServerFn(subscribe);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const result = await join({ data: { email } });
      setStatus("done");
      setEmail("");
      toast.success(
        result.alreadySubscribed ? "You're already on the list." : "You're on the list.",
        { description: "We'll let you know the moment RYVORA launches." },
      );
    } catch {
      setStatus("idle");
      toast.error("That didn't go through", { description: "Check the email and try again." });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={fabric}
        alt="Soft ivory fabric folds"
        width={1536}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/55" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between px-6 py-10 sm:px-10 sm:py-14">
        <header className="flex items-start justify-between gap-6">
          <div className="fade-up text-eyebrow max-w-[9rem]">
            Same
            <br />
            vision
            <br />a bolder
            <br />
            future
            <span className="rule-line mt-3" />
          </div>
          <div className="fade-up text-eyebrow text-right">
            Karachi,
            <br />
            Pakistan
            <span className="rule-line mt-3 ml-auto" />
          </div>
        </header>

        <section className="fade-up flex flex-col items-center text-center">
          <h1 className="font-sans text-3xl tracking-brand sm:text-5xl">
            <span className="pl-[0.42em]">RYVOR&#923;</span>
          </h1>
          <p className="text-eyebrow mt-4">Designed the way you live.</p>

          <p className="mt-10 font-display text-[3.75rem] leading-[0.92] font-medium sm:mt-14 sm:text-[7rem]">
            COMING
            <br />
            SOON
          </p>

          <span className="rule-line mt-8" />

          <p className="text-eyebrow mt-8">
            More than clothing.
            <br />A lifestyle in the making.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md border border-input">
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER YOUR EMAIL"
              className="text-eyebrow h-14 flex-1 bg-transparent px-5 text-foreground outline-none placeholder:text-muted-foreground focus:bg-card/40"
            />
            <button
              type="submit"
              aria-label="Join the list"
              disabled={status === "sending"}
              className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-60"
            >
              {status === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </form>

          <p className="text-eyebrow mt-6">Be the first to know.</p>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RYVORA on Instagram"
            className="mt-6 inline-flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"
          >
            <Instagram className="h-5 w-5" strokeWidth={1.25} />
          </a>
        </section>

        <footer className="flex items-end justify-between gap-6">
          <div className="fade-up text-eyebrow">
            Clothing
            <br />
            Culture
            <br />
            Community
            <span className="rule-line mt-3" />
          </div>
          <div className="fade-up text-eyebrow text-right">
            Est. 2026
            <span className="rule-line mt-3 ml-auto" />
          </div>
        </footer>
      </div>
    </main>
  );
}
