import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Kametrix",
  robots: "noindex",
};

export default function DatenschutzPage() {
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
          <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>

          {/* Verantwortlicher */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              1. Verantwortlicher
            </h2>
            <p className="text-foreground">
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO):
            </p>
            <p className="text-foreground mt-4">
              [FIRMENNAME] [RECHTSFORM]
              <br />
              [STRASSE HAUSNUMMER]
              <br />
              [PLZ STADT]
              <br />
              Deutschland
              <br />
              E-Mail:{" "}
              <a
                href="mailto:[EMAIL]"
                className="text-primary hover:underline"
              >
                [EMAIL]
              </a>
            </p>
          </section>

          {/* Betroffenenrechte */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              2. Ihre Rechte als betroffene Person
            </h2>
            <p className="text-foreground">
              Sie haben gemäß DSGVO folgende Rechte:
            </p>
            <ul className="list-disc pl-6 mt-4 text-foreground space-y-2">
              <li>
                <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können
                Auskunft über Ihre bei uns gespeicherten personenbezogenen
                Daten verlangen.
              </li>
              <li>
                <strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Sie können
                die Berichtigung unrichtiger Daten verlangen.
              </li>
              <li>
                <strong>Löschungsrecht (Art. 17 DSGVO):</strong> Sie können die
                Löschung Ihrer Daten verlangen, sofern keine gesetzlichen
                Aufbewahrungspflichten entgegenstehen.
              </li>
              <li>
                <strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong>{" "}
                Sie können die Einschränkung der Verarbeitung Ihrer Daten
                verlangen.
              </li>
              <li>
                <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie
                können verlangen, dass wir Ihnen Ihre Daten in einem gängigen
                Format übermitteln.
              </li>
              <li>
                <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können
                der Verarbeitung Ihrer Daten widersprechen.
              </li>
              <li>
                <strong>Beschwerderecht:</strong> Sie haben das Recht, sich bei
                einer Datenschutz-Aufsichtsbehörde zu beschweren.
              </li>
            </ul>
          </section>

          {/* Verarbeitung von Sprachdaten - CRITICAL for Voice AI */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              3. Verarbeitung von Sprachdaten
            </h2>

            <h3 className="text-lg font-medium mb-3 mt-6">
              3.1 Telefonate und Sprachaufzeichnungen
            </h3>
            <p className="text-foreground">
              Wenn Sie mit unserem KI-Telefonassistenten sprechen, werden Ihre
              Gespräche aufgezeichnet und verarbeitet. Dies umfasst:
            </p>
            <ul className="list-disc pl-6 mt-4 text-foreground space-y-2">
              <li>Sprachaufnahmen der Telefonate</li>
              <li>Transkriptionen (Text-Umwandlung) der Gespräche</li>
              <li>Telefonnummer des Anrufers</li>
              <li>Datum, Uhrzeit und Dauer des Anrufs</li>
            </ul>

            <h3 className="text-lg font-medium mb-3 mt-6">
              3.2 Zweck der Verarbeitung
            </h3>
            <p className="text-foreground">
              Die Datenverarbeitung erfolgt zur Erbringung unserer
              Dienstleistung (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO)
              sowie zur Qualitätssicherung und Verbesserung unserer KI-Systeme
              (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO).
            </p>

            <h3 className="text-lg font-medium mb-3 mt-6">
              3.3 Auftragsverarbeiter
            </h3>
            <p className="text-foreground">
              Wir setzen folgende Dienstleister als Auftragsverarbeiter ein:
            </p>
            <ul className="list-disc pl-6 mt-4 text-foreground space-y-2">
              <li>
                <strong>Vapi Inc.</strong> (USA) – Betrieb der
                KI-Telefonassistenten
                <br />
                <a
                  href="https://vapi.ai/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://vapi.ai/privacy
                </a>
              </li>
              <li>
                <strong>Google LLC</strong> (USA) – Kalenderintegration
                <br />
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://policies.google.com/privacy
                </a>
              </li>
            </ul>

            <h3 className="text-lg font-medium mb-3 mt-6">
              3.4 Datenübermittlung in Drittländer
            </h3>
            <p className="text-foreground">
              Die oben genannten Dienstleister haben ihren Sitz in den USA. Die
              Übermittlung erfolgt auf Grundlage von Standardvertragsklauseln
              (Art. 46 Abs. 2 lit. c DSGVO).
            </p>

            <h3 className="text-lg font-medium mb-3 mt-6">3.5 Speicherdauer</h3>
            <p className="text-foreground">
              Sprachaufnahmen und Transkripte werden für [SPEICHERDAUER_TAGE]
              Tage gespeichert, sofern keine längere Aufbewahrung gesetzlich
              erforderlich ist oder Sie einer längeren Speicherung zugestimmt
              haben.
            </p>
          </section>

          {/* Zahlungsabwicklung */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              4. Zahlungsabwicklung
            </h2>
            <p className="text-foreground">
              Für die Zahlungsabwicklung nutzen wir den Dienst Stripe. Dabei
              werden folgende Daten an Stripe übermittelt:
            </p>
            <ul className="list-disc pl-6 mt-4 text-foreground space-y-2">
              <li>Name und E-Mail-Adresse</li>
              <li>Zahlungsinformationen (Kreditkartendaten werden nur von Stripe verarbeitet)</li>
              <li>Rechnungsadresse</li>
            </ul>
            <p className="text-foreground mt-4">
              Anbieter: Stripe Payments Europe, Ltd., 1 Grand Canal Street
              Lower, Grand Canal Dock, Dublin, Irland
              <br />
              <a
                href="https://stripe.com/de/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://stripe.com/de/privacy
              </a>
            </p>
            <p className="text-foreground mt-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              5. Cookies und Einwilligung
            </h2>
            <p className="text-foreground">
              Diese Website verwendet Cookies. Cookies sind kleine Textdateien,
              die auf Ihrem Endgerät gespeichert werden.
            </p>

            <h3 className="text-lg font-medium mb-3 mt-6">
              5.1 Notwendige Cookies
            </h3>
            <p className="text-foreground">
              Einige Cookies sind technisch notwendig für den Betrieb der
              Website. Diese werden ohne Ihre Einwilligung gesetzt
              (Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG).
            </p>

            <h3 className="text-lg font-medium mb-3 mt-6">
              5.2 Analyse-Cookies
            </h3>
            <p className="text-foreground">
              Analyse-Cookies werden nur mit Ihrer ausdrücklichen Einwilligung
              gesetzt (Rechtsgrundlage: § 25 Abs. 1 TDDDG i.V.m. Art. 6 Abs. 1
              lit. a DSGVO). Sie können Ihre Einwilligung jederzeit widerrufen.
            </p>

            <h3 className="text-lg font-medium mb-3 mt-6">
              5.3 Cookie-Einstellungen ändern
            </h3>
            <p className="text-foreground">
              Sie können Ihre Cookie-Einstellungen jederzeit über den Link
              &quot;Cookie-Einstellungen&quot; im Footer der Website anpassen.
            </p>
          </section>

          {/* Hosting */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Hosting</h2>
            <p className="text-foreground">
              Diese Website wird gehostet bei [HOSTING-ANBIETER]. Der
              Hoster erhebt in sog. Logfiles folgende Daten, die Ihr Browser
              übermittelt:
            </p>
            <ul className="list-disc pl-6 mt-4 text-foreground space-y-2">
              <li>IP-Adresse</li>
              <li>Datum und Uhrzeit der Anfrage</li>
              <li>Zeitzonendifferenz zur Greenwich Mean Time (GMT)</li>
              <li>Inhalt der Anforderung (konkrete Seite)</li>
              <li>Zugriffsstatus/HTTP-Statuscode</li>
              <li>übertragene Datenmenge</li>
              <li>Website, von der die Anforderung kommt</li>
              <li>Browser und Browserversion</li>
              <li>Betriebssystem und dessen Oberfläche</li>
            </ul>
            <p className="text-foreground mt-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an der sicheren Bereitstellung der Website)
            </p>
          </section>

          {/* Kontaktaufnahme */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              7. Kontaktaufnahme
            </h2>
            <p className="text-foreground">
              Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben zur
              Bearbeitung der Anfrage bei uns gespeichert. Diese Daten geben
              wir nicht ohne Ihre Einwilligung weiter.
            </p>
            <p className="text-foreground mt-4">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche
              Maßnahmen) oder Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse)
            </p>
          </section>

          {/* Änderungen */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              8. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="text-foreground">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen,
              damit sie stets den aktuellen rechtlichen Anforderungen
              entspricht oder um Änderungen unserer Leistungen in der
              Datenschutzerklärung umzusetzen.
            </p>
            <p className="text-foreground mt-4">
              Stand: [STAND_DATUM]
            </p>
          </section>
        </article>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/impressum"
            className="text-muted-foreground hover:text-foreground"
          >
            Impressum &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
