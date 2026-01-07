'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Rocket,
  Calendar,
  Bot,
  Wallet,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FAQAccordion } from '@/components/onboarding';
import { useOnboarding } from '@/components/onboarding';

export default function HelpPage() {
  const { showOnboarding } = useOnboarding();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Hilfe & Support</h1>
              <p className="text-sm text-muted-foreground">
                Finden Sie Antworten auf häufig gestellte Fragen
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={showOnboarding}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Tutorial starten</h3>
                <p className="text-sm text-muted-foreground">
                  Einführung wiederholen
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Dokumentation</h3>
                <p className="text-sm text-muted-foreground">
                  Ausführliche Anleitungen
                </p>
              </div>
            </CardContent>
          </Card>

          <a href="mailto:support@kametrix.de">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Support kontaktieren</h3>
                  <p className="text-sm text-muted-foreground">
                    support@kametrix.de
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Feature Guides */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Funktionsübersicht</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={Bot}
              title="KI-Assistenten"
              description="Erstellen und verwalten Sie intelligente Telefonassistenten für Ihr Unternehmen."
              features={[
                'Individuelle Begrüßung',
                'FAQ-Integration',
                'Verschiedene Stimmen',
                '24/7 verfügbar',
              ]}
            />
            <FeatureCard
              icon={Calendar}
              title="Kalender-Integration"
              description="Verbinden Sie Ihren Google Kalender für automatische Terminbuchung."
              features={[
                'Google Kalender Sync',
                'Konflikterkennung',
                'Einladungen versenden',
                'Flexible Termindauer',
              ]}
            />
            <FeatureCard
              icon={Wallet}
              title="Guthaben-System"
              description="Flexibles Pay-per-Use Modell ohne monatliche Fixkosten."
              features={[
                'Minutengenaue Abrechnung',
                'Kein Guthabenverfall',
                'Verschiedene Pakete',
                'Sichere Zahlung',
              ]}
            />
            <FeatureCard
              icon={Rocket}
              title="Erste Schritte"
              description="So starten Sie schnell und einfach mit Kametrix."
              features={[
                '5-Minuten Setup',
                'Testanrufe möglich',
                'Einfache Konfiguration',
                'Sofort einsatzbereit',
              ]}
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Häufig gestellte Fragen</h2>
          <Card>
            <CardContent className="p-6">
              <FAQAccordion showCategories={true} />
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="mt-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Noch Fragen?</h2>
              <p className="text-muted-foreground mb-4">
                Unser Support-Team hilft Ihnen gerne weiter
              </p>
              <a href="mailto:support@kametrix.de">
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Support kontaktieren
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
}

function FeatureCard({ icon: Icon, title, description, features }: FeatureCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
