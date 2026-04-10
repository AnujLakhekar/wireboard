"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroHeader } from "@/components/header";

const capabilityCards = [
  {
    title: "Document Creator",
    description: "Generate polished specs, docs, and share-ready proposals from one canvas.",
  },
  {
    title: "Canvas + AI",
    description: "Sketch ideas visually and ask AI to refine content and structure instantly.",
  },
  {
    title: "Team Workflows",
    description: "Assign, review, and ship your board content with focused team spaces.",
  },
];

export default function Home() {
  return (
    <>
      <HeroHeader />
      <main className="relative overflow-hidden">
        <section className="px-6 pb-16 pt-32 md:pt-40">
          <div className="mx-auto max-w-6xl">
            <Link
              href="#features"
              className="hover:bg-background bg-muted mx-auto flex w-fit items-center gap-3 rounded-full border px-4 py-1.5 text-sm text-muted-foreground transition-colors"
            >
              Introducing smarter boards for creators
              <span className="grid size-5 place-items-center rounded-full bg-background">
                <ArrowRight className="size-3.5" />
              </span>
            </Link>

            <h1 className="mx-auto mt-8 max-w-5xl text-balance text-center text-5xl font-semibold leading-tight md:text-7xl">
              Build, design, and publish with Wireboard in one place
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-center text-lg text-muted-foreground">
              A collaborative board for fast ideation and production-ready documents.
              Start with your blank board, then plug in tools like Document Creator and AI flows.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl px-6">
                <Link href="/app">Open Wireboard App</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 pb-20 pt-8 md:pb-28">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {capabilityCards.map((card) => (
              <article
                key={card.title}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <h2 className="text-xl font-semibold">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
                <Link
                  href="/app"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground"
                >
                  Explore
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="solutions" className="px-6 pb-10">
          <div className="mx-auto max-w-6xl rounded-2xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">Solutions for creators and teams</h2>
            <p className="mt-2 text-muted-foreground">
              Build your own Wireboard stack with document workflows, AI support, and reusable
              templates.
            </p>
          </div>
        </section>

        <section id="pricing" className="px-6 pb-10">
          <div className="mx-auto max-w-6xl rounded-2xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">Pricing</h2>
            <p className="mt-2 text-muted-foreground">
              Start free and add more workspace features when your team grows.
            </p>
          </div>
        </section>

        <section id="about" className="px-6 pb-16">
          <div className="mx-auto max-w-6xl rounded-2xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">About Wireboard</h2>
            <p className="mt-2 text-muted-foreground">
              Wireboard helps teams go from idea to shipped documents with fewer tools and faster
              collaboration.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
