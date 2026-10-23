"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldError, FieldHint, Label } from "@/components/ui/label";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SystemLoading } from "@/components/system-loading";
import { SystemState } from "@/components/system-state";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-line py-10">
      <h2 className="font-heading text-h2 text-cream">{title}</h2>
      {children}
    </section>
  );
}

export function ComponentGallery() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-background text-cream">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <p className="font-label mb-3 tracking-[0.12em] text-signal">
          Internal
        </p>
        <h1 className="font-display text-title text-cream">Components</h1>
        <p className="mt-4 max-w-xl text-base text-fg-muted">
          F5 base UI on near-black. Signal orange is a small mono label only.
        </p>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="bg-cream p-6 text-ink">
            <p className="font-label mb-3 tracking-[0.1em] text-ink">
              On cream
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button tone="cream">Primary</Button>
              <Button variant="secondary" tone="cream">
                Secondary
              </Button>
              <Button variant="ghost" tone="cream">
                Ghost
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="font-label text-signal tracking-[0.08em]"
            onClick={() => setLoading((value) => !value)}
          >
            {loading ? "Stop demo loading" : "Toggle demo loading"}
          </button>
          {loading ? <Button loading>Working</Button> : null}
        </Section>

        <Section title="Inputs">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gallery-email">Email</Label>
              <Input
                id="gallery-email"
                type="email"
                placeholder="you@example.com"
              />
              <FieldHint>Body text stays at 16px.</FieldHint>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gallery-code">Unlock code</Label>
              <Input id="gallery-code" defaultValue="MB-104" aria-invalid />
              <FieldError>That code is not in this edition.</FieldError>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="gallery-notes">Notes</Label>
              <Textarea id="gallery-notes" placeholder="A closer look" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gallery-select">Edition</Label>
              <Select id="gallery-select" defaultValue="standard">
                <option value="standard">Standard</option>
                <option value="holiday">Holiday</option>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Notify</Label>
              <label className="flex items-center gap-2 text-base text-cream">
                <Checkbox defaultChecked />
                Email when a plate unlocks
              </label>
              <RadioGroup>
                <legend className="font-label tracking-[0.1em] text-fg-muted">
                  Binding
                </legend>
                <label className="flex items-center gap-2 text-base">
                  <Radio name="binding" defaultChecked />
                  Perfect bound
                </label>
                <label className="flex items-center gap-2 text-base">
                  <Radio name="binding" />
                  Spiral
                </label>
              </RadioGroup>
            </div>
          </div>
        </Section>

        <Section title="Cards, tabs, badges">
          <Card>
            <CardHeader>
              <CardTitle>Track progress</CardTitle>
              <CardDescription>
                Scan a colored plate to earn points.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>How it works</Badge>
              <Badge variant="accent">Holiday</Badge>
              <Badge variant="outline">Plate 07</Badge>
            </CardContent>
            <CardFooter>
              <Button size="sm">Open scanner</Button>
            </CardFooter>
          </Card>
          <Tabs defaultValue="ink">
            <TabsList>
              <TabsTrigger value="ink">Ink</TabsTrigger>
              <TabsTrigger value="cream">Cream</TabsTrigger>
            </TabsList>
            <TabsContent
              value="ink"
              className="pt-4 text-base text-fg-secondary"
            >
              Near-black field with cream type.
            </TabsContent>
            <TabsContent
              value="cream"
              className="pt-4 text-base text-fg-secondary"
            >
              Cream field uses ink type and an ink focus ring.
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Avatar, dialog, sheet">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>MB</AvatarFallback>
            </Avatar>
            <Dialog>
              <DialogTrigger
                className={buttonVariants({ variant: "secondary" })}
              >
                Open dialog
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Unlock the plate</DialogTitle>
                <DialogDescription>
                  Enter the code printed on the back matter page.
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger className={buttonVariants({ variant: "ghost" })}>
                Open sheet
              </SheetTrigger>
              <SheetContent className="p-6">
                <SheetTitle>Cart</SheetTitle>
                <p className="mt-3 text-base text-fg-muted">
                  Sheet chrome uses the same surface and line tokens.
                </p>
              </SheetContent>
            </Sheet>
          </div>
        </Section>

        <Section title="System states">
          <div className="flex flex-col gap-12">
            <SystemState kind="notFound" />
            <SystemState kind="error" reset={() => undefined} />
            <SystemLoading variant="catalog" />
          </div>
        </Section>
      </div>
    </main>
  );
}
