import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";

export const metadata: Metadata = {
  title: "Kametrix | KI-Telefonassistent für Ihr Unternehmen",
  description:
    "Verpassen Sie nie wieder einen Anruf. Unser KI-Assistent beantwortet Kundenanfragen und bucht Termine - rund um die Uhr. In Minuten einsatzbereit.",
  openGraph: {
    title: "Kametrix | KI-Telefonassistent für Ihr Unternehmen",
    description:
      "Verpassen Sie nie wieder einen Anruf. Unser KI-Assistent beantwortet Kundenanfragen und bucht Termine - rund um die Uhr.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
    </>
  );
}
