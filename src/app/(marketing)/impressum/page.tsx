import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum | Kametrix",
  robots: "noindex",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-16 px-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          &larr; Zurück zur Startseite
        </Link>

        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">Impressum</h1>
          <p className="text-muted-foreground mb-8">Angaben gemäß § 5 DDG</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Anbieter</h2>
            <p className="text-foreground">
              [FIRMENNAME] [RECHTSFORM]
              <br />
              [STRASSE HAUSNUMMER]
              <br />
              [PLZ STADT]
              <br />
              Deutschland
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
            <p className="text-foreground">
              E-Mail:{" "}
              <a
                href="mailto:[EMAIL]"
                className="text-primary hover:underline"
              >
                [EMAIL]
              </a>
              <br />
              Telefon: [TELEFON] (optional)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Vertreten durch</h2>
            <p className="text-foreground">
              Geschäftsführer: [GESCHÄFTSFÜHRER NAME]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Registereintrag</h2>
            <p className="text-foreground">
              Eingetragen im Handelsregister.
              <br />
              Registergericht: [AMTSGERICHT STADT]
              <br />
              Registernummer: HRB [NUMMER]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Umsatzsteuer-ID</h2>
            <p className="text-foreground">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
              <br />
              DE [UST-IDNR]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p className="text-foreground">
              [VERANTWORTLICHER NAME]
              <br />
              [STRASSE HAUSNUMMER]
              <br />
              [PLZ STADT]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Streitschlichtung
            </h2>
            <p className="text-foreground">
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-foreground mt-4">
              Wir sind nicht bereit oder verpflichtet, an
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/datenschutz"
            className="text-muted-foreground hover:text-foreground"
          >
            Datenschutzerklärung &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
