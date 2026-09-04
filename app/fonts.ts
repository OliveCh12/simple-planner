import {
  DM_Sans,
  Fraunces,
  IBM_Plex_Sans,
  Inter,
  Literata,
  Outfit,
  Source_Serif_4,
  Ubuntu,
} from "next/font/google";

export const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const fontClassNames = [
  ubuntu.variable,
  inter.variable,
  dmSans.variable,
  outfit.variable,
  ibmPlexSans.variable,
  sourceSerif.variable,
  literata.variable,
  fraunces.variable,
].join(" ");
