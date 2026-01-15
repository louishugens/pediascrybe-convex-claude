import Image from "next/image"
import path from "node:path"
import { existsSync } from "node:fs"
import {
  DM_Sans,
  Inter,
  Manrope,
  Nunito_Sans,
  Outfit,
  Plus_Jakarta_Sans,
  Sora,
  Urbanist,
} from "next/font/google"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })
const sora = Sora({ subsets: ["latin"] })
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] })
const manrope = Manrope({ subsets: ["latin"] })
const outfit = Outfit({ subsets: ["latin"] })
const urbanist = Urbanist({ subsets: ["latin"] })
const dmSans = DM_Sans({ subsets: ["latin"] })
const nunitoSans = Nunito_Sans({ subsets: ["latin"] })

interface WordmarkFontOption {
  id: string
  label: string
  className: string
  vibe: string
}

const wordmarkFonts: WordmarkFontOption[] = [
  {
    id: "sora",
    label: "Sora",
    className: sora.className,
    vibe: "Geometric, crisp (Resend-ish)",
  },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    className: plusJakartaSans.className,
    vibe: "Modern, confident",
  },
  {
    id: "inter",
    label: "Inter",
    className: inter.className,
    vibe: "Neutral, product-y",
  },
  {
    id: "manrope",
    label: "Manrope",
    className: manrope.className,
    vibe: "Friendly, slightly rounded",
  },
  {
    id: "outfit",
    label: "Outfit",
    className: outfit.className,
    vibe: "Clean, a bit playful",
  },
  {
    id: "urbanist",
    label: "Urbanist",
    className: urbanist.className,
    vibe: "Sleek, modern",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    className: dmSans.className,
    vibe: "Approachable, editorial",
  },
  {
    id: "nunito-sans",
    label: "Nunito Sans",
    className: nunitoSans.className,
    vibe: "Warm, pediatric-friendly",
  },
]

interface WordmarkTreatment {
  id: string
  label: string
  wordmarkClassName: string
  description: string
}

const wordmarkTreatments: WordmarkTreatment[] = [
  {
    id: "tight-bold",
    label: "Tight + bold",
    wordmarkClassName: "font-semibold tracking-[-0.04em]",
    description: "Closest to modern SaaS wordmarks (tight kerning)",
  },
  {
    id: "balanced",
    label: "Balanced",
    wordmarkClassName: "font-semibold tracking-[-0.02em]",
    description: "Safer default across sizes",
  },
  {
    id: "soft",
    label: "Soft contrast",
    wordmarkClassName: "tracking-[-0.03em]",
    description: "Subtle weight contrast between parts of the name",
  },
]

const brandBlue = {
  base: "#2563EB",
  deep: "#1D4ED8",
  electric: "#0EA5E9",
} as const

function LogoReference() {
  const hasSvg = existsSync(path.join(process.cwd(), "public", "@Pedialogo.svg"))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Reference
          <Badge variant="secondary">/public/@Pedialogo.svg</Badge>
        </CardTitle>
        <CardDescription>
          If the SVG isn’t in this repo yet, drop it into <code>public/</code>{" "}
          and refresh.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasSvg ? (
          <div className="flex items-center justify-center rounded-xl border bg-white p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Pediascrybe logo reference (SVG)"
              src="/@Pedialogo.svg"
              className="h-20 w-auto"
            />
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
            Could not find <code>public/@Pedialogo.svg</code> in this workspace.
            Showing existing <code>public/logo.png</code> instead.
          </div>
        )}

        <div className="flex items-center justify-center rounded-xl border bg-white p-6">
          <Image
            alt="Current logo mark (PNG)"
            src="/logo.png"
            width={96}
            height={96}
            priority
          />
        </div>
      </CardContent>
    </Card>
  )
}

function BlueSwatches() {
  const swatches = [
    { id: "base", label: "Base", hex: brandBlue.base },
    { id: "deep", label: "Deep", hex: brandBlue.deep },
    { id: "electric", label: "Electric accent", hex: brandBlue.electric },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Blue
          <Badge variant="secondary">more vibrant</Badge>
        </CardTitle>
        <CardDescription>
          Pick a primary (Base/Deep). Electric is a nice gradient accent.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {swatches.map((swatch) => (
          <div
            key={swatch.id}
            className="flex items-center gap-3 rounded-xl border p-3"
          >
            <div
              className="h-10 w-10 rounded-lg border"
              style={{ backgroundColor: swatch.hex }}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium">{swatch.label}</div>
              <div className="truncate text-xs text-muted-foreground">
                {swatch.hex}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function Wordmark({
  className,
  treatmentId,
}: {
  className: string
  treatmentId: WordmarkTreatment["id"]
}) {
  if (treatmentId === "soft") {
    return (
      <span className={cn("text-5xl sm:text-6xl", className)}>
        <span className="font-semibold">Pedia</span>
        <span className="font-medium">scrybe</span>
      </span>
    )
  }

  return (
    <span className={cn("text-5xl sm:text-6xl", className)}>Pediascrybe</span>
  )
}

export function LogoLab() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Logo Lab</h1>
          <Badge variant="secondary">wordmark exploration</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Compare Resend-inspired wordmark directions for{" "}
          <span className="font-medium">Pediascrybe</span> (font + weight +
          kerning). Once you pick a direction, we can refine spacing and tune the
          blue to match your exact SVG.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <LogoReference />
        <BlueSwatches />
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>How to choose</CardTitle>
            <CardDescription>
              Pick the one that feels “trustworthy + modern + pediatric”.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Sora</span> and{" "}
              <span className="font-medium text-foreground">
                Plus Jakarta Sans
              </span>{" "}
              tend to feel closest to the Resend vibe.
            </div>
            <div>
              <span className="font-medium text-foreground">Manrope</span> and{" "}
              <span className="font-medium text-foreground">Nunito Sans</span>{" "}
              skew warmer and more “peds”.
            </div>
            <div>
              Start with{" "}
              <span className="font-medium text-foreground">Tight + bold</span>{" "}
              then compare against{" "}
              <span className="font-medium text-foreground">Balanced</span>.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 space-y-10">
        {wordmarkTreatments.map((treatment) => (
          <section key={treatment.id} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {treatment.label}
              </h2>
              <Badge variant="secondary">{treatment.description}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {wordmarkFonts.map((font) => (
                <Card key={`${treatment.id}-${font.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3">
                      <span className="truncate">{font.label}</span>
                      <Badge variant="outline">{font.vibe}</Badge>
                    </CardTitle>
                    <CardDescription className="truncate">
                      Font id: <code>{font.id}</code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border bg-white p-6">
                      <div
                        className="leading-none"
                        style={{ color: brandBlue.base }}
                      >
                        <Wordmark
                          treatmentId={treatment.id}
                          className={cn(
                            font.className,
                            treatment.wordmarkClassName
                          )}
                        />
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Blue: {brandBlue.base}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border bg-white p-6">
                      <div
                        className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text leading-none text-transparent"
                        style={
                          {
                            ["--tw-gradient-from" as never]: brandBlue.deep,
                            ["--tw-gradient-via" as never]: brandBlue.base,
                            ["--tw-gradient-to" as never]: brandBlue.electric,
                          } as React.CSSProperties
                        }
                      >
                        <Wordmark
                          treatmentId={treatment.id}
                          className={cn(
                            font.className,
                            treatment.wordmarkClassName
                          )}
                        />
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Gradient: {brandBlue.deep} → {brandBlue.base} →{" "}
                        {brandBlue.electric}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}


