'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  X,
  ChevronRight,
  Rocket,
  Calendar,
  Bot,
  Wallet,
  BookOpen,
  Mail,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQAccordion, FAQCompact } from './faq-accordion';
import { Button } from '@/components/ui/button';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial?: () => void;
}

type HelpSection = 'main' | 'faq' | 'contact';

export function HelpPanel({ isOpen, onClose, onStartTutorial }: HelpPanelProps) {
  const [currentSection, setCurrentSection] = useState<HelpSection>('main');

  const handleClose = () => {
    setCurrentSection('main');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {currentSection !== 'main' && (
                  <button
                    onClick={() => setCurrentSection('main')}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 rotate-180" />
                  </button>
                )}
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">
                  {currentSection === 'main' && 'Hilfe & Support'}
                  {currentSection === 'faq' && 'Häufige Fragen'}
                  {currentSection === 'contact' && 'Kontakt'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentSection === 'main' && (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 space-y-6"
                  >
                    {/* Quick actions */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Schnellstart
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <QuickAction
                          icon={Rocket}
                          label="Tutorial starten"
                          onClick={onStartTutorial}
                        />
                        <QuickAction
                          icon={BookOpen}
                          label="FAQ ansehen"
                          onClick={() => setCurrentSection('faq')}
                        />
                      </div>
                    </div>

                    {/* Feature guides */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Funktionen
                      </h3>
                      <div className="space-y-1">
                        <FeatureGuide
                          icon={Bot}
                          title="KI-Assistent erstellen"
                          description="Erstellen Sie Ihren ersten Telefonassistenten"
                        />
                        <FeatureGuide
                          icon={Calendar}
                          title="Kalender verbinden"
                          description="Automatische Terminbuchung einrichten"
                        />
                        <FeatureGuide
                          icon={Wallet}
                          title="Credits kaufen"
                          description="Guthaben für Anrufe aufladen"
                        />
                      </div>
                    </div>

                    {/* Popular FAQs */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Beliebte Fragen
                        </h3>
                        <button
                          onClick={() => setCurrentSection('faq')}
                          className="text-xs text-primary hover:underline"
                        >
                          Alle ansehen
                        </button>
                      </div>
                      <FAQCompact category="getting-started" maxItems={3} />
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Noch Fragen?
                      </h3>
                      <button
                        onClick={() => setCurrentSection('contact')}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Support kontaktieren</p>
                          <p className="text-xs text-muted-foreground">
                            Wir helfen Ihnen gerne weiter
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentSection === 'faq' && (
                  <motion.div
                    key="faq"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4"
                  >
                    <FAQAccordion />
                  </motion.div>
                )}

                {currentSection === 'contact' && (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 space-y-6"
                  >
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Wie können wir helfen?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Unser Support-Team ist für Sie da
                      </p>
                    </div>

                    <div className="space-y-3">
                      <a
                        href="mailto:support@kametrix.de"
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Mail className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">E-Mail Support</p>
                          <p className="text-sm text-muted-foreground">
                            support@kametrix.de
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <h4 className="font-medium text-sm">Hilfreiche Informationen</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Beschreiben Sie Ihr Problem möglichst genau</li>
                        <li>• Nennen Sie Ihre Account-E-Mail-Adresse</li>
                        <li>• Fügen Sie Screenshots bei, wenn möglich</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon: Icon, label, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-all"
    >
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

interface FeatureGuideProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureGuide({ icon: Icon, title, description }: FeatureGuideProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

// Floating help button
interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function HelpButton({ onClick, className }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-30',
        'w-14 h-14 rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'hover:scale-105 active:scale-95',
        'transition-all duration-200',
        'flex items-center justify-center',
        'ring-4 ring-primary/20',
        className
      )}
      aria-label="Hilfe öffnen"
    >
      <HelpCircle className="h-6 w-6" />
    </button>
  );
}
