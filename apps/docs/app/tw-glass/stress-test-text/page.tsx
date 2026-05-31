"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { unsplash } from "../_shared/unsplash";
import {
  TableOfContents,
  Section,
  TestCard,
  FpsCounter,
  SliderControl,
} from "../_shared/stress-test";

const PHOTO_ID = "photo-1531366936337-7c912a4589a7";
const BG_IMAGE = unsplash(PHOTO_ID);

const SECTIONS = [
  { id: "mass-grid", label: "Mass Grid" },
  { id: "font-sizes", label: "Font Sizes" },
  { id: "font-weights", label: "Font Weights" },
  { id: "backgrounds", label: "Backgrounds" },
  { id: "long-copy", label: "Long Copy" },
  { id: "nested-containers", label: "Nested Containers" },
  { id: "scroll-stress", label: "Scroll Stress" },
  { id: "interactive", label: "Interactive" },
];

export default function GlassTextStressTestPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <header className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold">Glass Text Stress Test</h1>
          <p className="text-muted-foreground max-w-2xl">
            Pressure-test the glass-text utility under heavy load: many
            elements, extreme sizes, varied backgrounds, long copy, and all
            options simultaneously.
          </p>
        </header>

        <div className="flex gap-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <TableOfContents sections={SECTIONS} />
          </aside>

          <main className="min-w-0 flex-1 space-y-16">
            <MassGridSection />
            <FontSizeSection />
            <FontWeightSection />
            <BackgroundVariantsSection />
            <LongCopySection />
            <NestedContainersSection />
            <ScrollStressSection />
            <InteractiveSection />
          </main>
        </div>
      </div>
    </div>
  );
}

function DemoArea({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted relative overflow-hidden rounded-lg p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function GlassText({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("glass-text", className)}
      style={{
        // Solid fallback behind the clipped image: if the remote photo fails
        // to load, the letters show this color instead of vanishing. The
        // `.glass-text` utility only sets `color: transparent` under
        // @supports(background-clip:text), so unsupported browsers keep the
        // inherited (readable) text color.
        backgroundColor: "#3f3f46",
        backgroundImage: BG_IMAGE,
        backgroundAttachment: "fixed",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function MassGridSection() {
  const [count, setCount] = useState(24);
  const cols = Math.min(Math.ceil(Math.sqrt(count)), 8);

  return (
    <Section
      id="mass-grid"
      title="Mass Grid"
      description="Raw element count with glass-text. Crank the slider to stress the filter chain."
    >
      <TestCard
        title={`${count} glass-text elements`}
        description="Each cell is a glass-text heading over a shared photo background."
      >
        <div className="mb-4 flex items-center gap-4">
          <label
            className="flex items-center gap-2 text-sm font-medium"
            htmlFor="mass-grid-count"
          >
            Elements
            <span className="text-muted-foreground font-mono">{count}</span>
          </label>
          <input
            id="mass-grid-count"
            type="range"
            min="4"
            max="120"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="flex-1"
          />
          <FpsCounter />
        </div>
        <DemoArea>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="text-center">
                <GlassText className="text-3xl font-bold">Glass</GlassText>
              </div>
            ))}
          </div>
        </DemoArea>
      </TestCard>
    </Section>
  );
}

const FONT_SIZES = [
  { label: "text-sm", cls: "text-sm" },
  { label: "text-base", cls: "text-base" },
  { label: "text-2xl", cls: "text-2xl" },
  { label: "text-4xl", cls: "text-4xl" },
  { label: "text-6xl", cls: "text-6xl" },
  { label: "text-8xl", cls: "text-8xl" },
  { label: "text-9xl", cls: "text-9xl" },
];

function FontSizeSection() {
  return (
    <Section
      id="font-sizes"
      title="Font Sizes"
      description="Glass text at every scale, from body copy to hero headlines. Tests filter rendering at extreme glyph sizes."
    >
      <TestCard
        title="text-sm through text-9xl"
        description="Background-clip: text at every scale. The photo shows through each glyph."
      >
        <DemoArea>
          <div className="space-y-6">
            {FONT_SIZES.map(({ label, cls }) => (
              <div key={label} className="space-y-1">
                <code className="bg-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                  {label}
                </code>
                <div>
                  <GlassText className={cn("font-bold", cls)}>
                    tw-glass
                  </GlassText>
                </div>
              </div>
            ))}
          </div>
        </DemoArea>
      </TestCard>
    </Section>
  );
}

const FONT_WEIGHTS = [
  { label: "font-thin", cls: "font-thin" },
  { label: "font-light", cls: "font-light" },
  { label: "font-normal", cls: "font-normal" },
  { label: "font-medium", cls: "font-medium" },
  { label: "font-semibold", cls: "font-semibold" },
  { label: "font-bold", cls: "font-bold" },
  { label: "font-extrabold", cls: "font-extrabold" },
  { label: "font-black", cls: "font-black" },
];

function FontWeightSection() {
  return (
    <Section
      id="font-weights"
      title="Font Weights"
      description="Stroke weight affects how much of the photo is visible through each glyph."
    >
      <TestCard
        title="font-thin through font-black"
        description="All at text-5xl to make weight differences visible."
      >
        <DemoArea>
          <div className="space-y-4">
            {FONT_WEIGHTS.map(({ label, cls }) => (
              <div key={label} className="flex items-baseline gap-4">
                <code className="bg-foreground/10 text-muted-foreground w-32 shrink-0 rounded px-1.5 py-0.5 text-right font-mono text-[10px]">
                  {label}
                </code>
                <GlassText className={cn("text-5xl", cls)}>tw-glass</GlassText>
              </div>
            ))}
          </div>
        </DemoArea>
      </TestCard>
    </Section>
  );
}

const BG_VARIANTS: {
  label: string;
  style: React.CSSProperties;
}[] = [
  {
    label: "Photo (fixed)",
    style: {
      backgroundImage: BG_IMAGE,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    },
  },
  {
    label: "Linear gradient",
    style: {
      backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
  },
  {
    label: "Radial gradient",
    style: {
      backgroundImage:
        "radial-gradient(circle at 30% 40%, #f093fb, #f5576c, #4facfe)",
    },
  },
  {
    label: "Conic gradient",
    style: {
      backgroundImage:
        "conic-gradient(from 45deg, #12c2e9, #c471ed, #f64f59, #12c2e9)",
    },
  },
  {
    label: "Solid color",
    style: { backgroundImage: "none", backgroundColor: "#888" },
  },
  {
    label: "Dark solid",
    style: { backgroundImage: "none", backgroundColor: "#222" },
  },
];

function BackgroundVariantsSection() {
  return (
    <Section
      id="backgrounds"
      title="Background Variants"
      description="Different background sources clipped through the text shape. Photos, gradients, and solids."
    >
      <TestCard
        title="6 background styles"
        description="Each heading uses a different background-image/color with background-clip: text."
      >
        <DemoArea>
          <div className="grid gap-6 sm:grid-cols-2">
            {BG_VARIANTS.map(({ label, style }) => (
              <div key={label} className="space-y-1">
                <code className="bg-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                  {label}
                </code>
                <div>
                  <GlassText className="text-5xl font-bold" style={style}>
                    tw-glass
                  </GlassText>
                </div>
              </div>
            ))}
          </div>
        </DemoArea>
      </TestCard>
    </Section>
  );
}

const LOREM =
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. Sphinx of black quartz, judge my vow.";

function LongCopySection() {
  return (
    <Section
      id="long-copy"
      title="Long Copy"
      description="Glass text applied to paragraphs and multi-line content. Tests filter performance on large text blocks."
    >
      <TestCard
        title="Paragraph text"
        description="Full paragraphs of glass text at different sizes."
      >
        <DemoArea>
          <div className="space-y-6">
            <div className="space-y-1">
              <code className="bg-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                text-lg
              </code>
              <p>
                <GlassText className="text-lg leading-relaxed font-medium">
                  {LOREM} {LOREM}
                </GlassText>
              </p>
            </div>

            <div className="space-y-1">
              <code className="bg-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                text-2xl
              </code>
              <p>
                <GlassText className="text-2xl leading-relaxed font-semibold">
                  {LOREM}
                </GlassText>
              </p>
            </div>

            <div className="space-y-1">
              <code className="bg-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                text-4xl (multiline)
              </code>
              <p>
                <GlassText className="text-4xl leading-tight font-bold">
                  {LOREM}
                </GlassText>
              </p>
            </div>
          </div>
        </DemoArea>
      </TestCard>
    </Section>
  );
}

function NestedContainersSection() {
  return (
    <Section
      id="nested-containers"
      title="Nested Containers"
      description="Glass text inside glass panels, and glass panels inside glass text regions. Tests filter stacking."
    >
      <TestCard
        title="glass-text inside glass panels"
        description="Glass text headings rendered within glass containers."
      >
        <DemoArea>
          <div className="space-y-4">
            <div className="glass rounded-xl p-6">
              <GlassText className="text-4xl font-bold">
                Heading inside glass
              </GlassText>
              <p className="text-muted-foreground mt-2 text-sm">
                Regular text below the glass heading.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass glass-refract-30 rounded-xl p-6">
                <GlassText className="text-2xl font-bold">Panel A</GlassText>
              </div>
              <div className="glass glass-aberration-20 rounded-xl p-6">
                <GlassText className="text-2xl font-bold">Panel B</GlassText>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="glass rounded-lg p-4">
                <GlassText className="text-3xl font-bold">
                  Double nested
                </GlassText>
              </div>
            </div>
          </div>
        </DemoArea>
      </TestCard>
    </Section>
  );
}

function ScrollStressSection() {
  return (
    <Section
      id="scroll-stress"
      title="Scroll Stress"
      description="40 glass-text headings stacked vertically. Tests filter performance during scroll."
    >
      <TestCard
        title="Scroll through glass text headings"
        description="Each heading uses background-clip: text with a fixed background. Tests performance during scroll."
      >
        <div className="bg-muted relative h-[500px] overflow-y-auto rounded-lg">
          <div className="space-y-4 p-4">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="border-foreground/10 rounded-xl border border-dashed px-4 py-3"
              >
                <GlassText className="text-3xl font-bold">
                  Glass heading {i + 1}
                </GlassText>
              </div>
            ))}
          </div>
        </div>
      </TestCard>
    </Section>
  );
}

const PHOTO_OPTIONS = [
  { label: "Aurora", id: "photo-1531366936337-7c912a4589a7" },
  { label: "Fern", id: "photo-1557672172-298e090bd0f1" },
  { label: "Wave", id: "photo-1659762073691-e724db40f9d5" },
  { label: "Gradient", id: "" },
];

function InteractiveSection() {
  const [count, setCount] = useState(8);
  const [fontSize, setFontSize] = useState(64);
  const [fontWeight, setFontWeight] = useState(700);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [text, setText] = useState("tw-glass");

  const cols = Math.min(count, 4);

  const photo = PHOTO_OPTIONS[photoIdx];
  const bgStyle: React.CSSProperties = photo?.id
    ? {
        backgroundImage: unsplash(photo.id),
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : {
        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      };

  return (
    <Section
      id="interactive"
      title="Interactive"
      description="User-controlled parameters. All sliders update in real time."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <SliderControl
            id="int-count"
            label="Elements"
            value={count}
            min={1}
            max={48}
            onChange={setCount}
            display={`${count}`}
          />

          <SliderControl
            id="int-font-size"
            label="Font Size"
            value={fontSize}
            min={12}
            max={192}
            onChange={setFontSize}
            display={`${fontSize}px`}
          />

          <SliderControl
            id="int-font-weight"
            label="Font Weight"
            value={fontWeight}
            min={100}
            max={900}
            step={100}
            onChange={setFontWeight}
            display={`${fontWeight}`}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="int-text">
              Text
            </label>
            <input
              id="int-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Background</span>
            <div className="flex gap-2">
              {PHOTO_OPTIONS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors",
                    {
                      "bg-foreground text-background": photoIdx === i,
                      "bg-muted text-muted-foreground hover:bg-muted/80":
                        photoIdx !== i,
                    },
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <FpsCounter />
        </div>

        <div>
          <DemoArea>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="text-center">
                  <GlassText
                    className="inline-block"
                    style={{
                      ...bgStyle,
                      fontSize: `${fontSize}px`,
                      fontWeight,
                    }}
                  >
                    {text}
                  </GlassText>
                </div>
              ))}
            </div>
          </DemoArea>
        </div>
      </div>
    </Section>
  );
}
