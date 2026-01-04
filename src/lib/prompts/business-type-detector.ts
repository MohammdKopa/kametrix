/**
 * Business type detection for context-aware prompt generation
 *
 * Analyzes business name, description, and services to determine
 * the industry type for tailored prompt generation.
 */

import type { BusinessType } from './types';

/**
 * Industry keywords for automatic business type detection
 */
const BUSINESS_TYPE_KEYWORDS: Record<BusinessType, string[]> = {
  gastronomy: [
    'restaurant',
    'ristorante',
    'pizzeria',
    'bistro',
    'café',
    'cafe',
    'kaffee',
    'bäckerei',
    'backerei',
    'konditorei',
    'bar',
    'kneipe',
    'imbiss',
    'döner',
    'doner',
    'sushi',
    'küche',
    'kuche',
    'speisen',
    'essen',
    'koch',
    'kulinarisch',
    'gasthaus',
    'wirtshaus',
    'trattoria',
    'catering',
    'gastronomie',
    'gastro',
    'lokal',
    'speisekarte',
    'lieferservice',
    'lieferdienst',
  ],
  salon: [
    'friseur',
    'frisör',
    'frisor',
    'salon',
    'haare',
    'schnitt',
    'färben',
    'farben',
    'styling',
    'kosmetik',
    'nagel',
    'maniküre',
    'manikure',
    'pediküre',
    'pedikure',
    'wellness',
    'spa',
    'massage',
    'beauty',
    'pflege',
    'nagelstudio',
    'haarstudio',
    'barbershop',
    'barber',
    'makeup',
    'schönheit',
    'schonheit',
  ],
  medical: [
    'arzt',
    'ärztin',
    'arztin',
    'praxis',
    'klinik',
    'zahnarzt',
    'zahnärztin',
    'orthopäde',
    'orthopaede',
    'physiotherapie',
    'physio',
    'heilpraktiker',
    'therapeut',
    'psychologe',
    'psychologin',
    'apotheke',
    'medizinisch',
    'gesundheit',
    'patient',
    'behandlung',
    'therapie',
    'doktor',
    'dr.',
    'medizin',
    'chirurg',
    'krankengymnastik',
    'osteopathie',
    'kardiologe',
    'dermatologe',
    'augenarzt',
    'hno',
  ],
  trade: [
    'handwerker',
    'elektriker',
    'elektro',
    'klempner',
    'sanitär',
    'sanitar',
    'heizung',
    'maler',
    'schreiner',
    'tischler',
    'dachdecker',
    'installateur',
    'reparatur',
    'montage',
    'renovierung',
    'bauarbeiten',
    'bau',
    'handwerk',
    'meister',
    'meisterbetrieb',
    'installation',
    'werkstatt',
    'kfz',
    'autowerkstatt',
    'mechaniker',
    'schlüsseldienst',
    'schlussseldienst',
    'umzug',
    'gartenbau',
    'fliesenleger',
  ],
  retail: [
    'laden',
    'shop',
    'geschäft',
    'geschaft',
    'boutique',
    'kaufen',
    'verkauf',
    'produkte',
    'waren',
    'sortiment',
    'bestellung',
    'handel',
    'einzelhandel',
    'markt',
    'supermarkt',
    'lebensmittel',
    'drogerie',
    'buchhandlung',
    'bücher',
    'bucher',
    'elektromarkt',
    'möbel',
    'mobel',
    'mode',
    'bekleidung',
    'schmuck',
    'optiker',
    'brillen',
  ],
  service: [
    'beratung',
    'service',
    'agentur',
    'büro',
    'buro',
    'versicherung',
    'steuerberater',
    'rechtsanwalt',
    'anwalt',
    'kanzlei',
    'it',
    'software',
    'digital',
    'consulting',
    'unternehmensberatung',
    'finanz',
    'immobilien',
    'makler',
    'hausverwaltung',
    'reinigung',
    'reinigungsservice',
    'fotograf',
    'fotografin',
    'fotografie',
    'design',
    'webdesign',
    'marketing',
    'werbung',
    'eventplanung',
    'veranstaltung',
  ],
  general: [],
};

/**
 * Context-specific guidelines for each business type
 */
export const BUSINESS_TYPE_CONTEXT: Record<
  BusinessType,
  {
    typicalQueries: string[];
    keyResponsibilities: string[];
    avoidTopics: string[];
    suggestedTone: string;
  }
> = {
  gastronomy: {
    typicalQueries: [
      'Reservierungen und Tischverfuegbarkeit',
      'Speisekarte und Tagesangebote',
      'Allergien und Unvertraeglichkeiten',
      'Lieferung und Abholung',
      'Oeffnungszeiten und Standort',
    ],
    keyResponsibilities: [
      'Reservierungen entgegennehmen',
      'Ueber Speiseangebot informieren',
      'Auf Allergien hinweisen und nachfragen',
      'Lieferoptionen erklaeren',
    ],
    avoidTopics: ['Detaillierte Kochrezepte', 'Kritik an anderen Restaurants'],
    suggestedTone: 'Herzlich und einladend, wie ein aufmerksamer Gastgeber',
  },
  salon: {
    typicalQueries: [
      'Terminvereinbarung und Verfuegbarkeit',
      'Preise und Behandlungsdauer',
      'Beratung zu Styling und Pflege',
      'Stornierung und Umbuchung',
      'Produktverkauf',
    ],
    keyResponsibilities: [
      'Termine koordinieren',
      'Preisinformationen geben',
      'Zu Behandlungen beraten',
      'Wartezeiten kommunizieren',
    ],
    avoidTopics: ['Medizinische Hautberatung', 'Kritik am Aussehen'],
    suggestedTone: 'Freundlich und persoenlich, mit Fokus auf Wohlbefinden',
  },
  medical: {
    typicalQueries: [
      'Terminvereinbarung (dringend/regulaer)',
      'Benoetigte Unterlagen',
      'Rezeptbestellung',
      'Ueberweisungen',
      'Notfaelle und Bereitschaft',
    ],
    keyResponsibilities: [
      'Termine effizient vergeben',
      'Auf Unterlagen hinweisen',
      'Dringlichkeit einschaetzen',
      'An Notdienst verweisen wenn noetig',
    ],
    avoidTopics: [
      'Medizinische Diagnosen',
      'Behandlungsempfehlungen',
      'Medikamentendosierungen',
    ],
    suggestedTone: 'Professionell und beruhigend, mit Empathie',
  },
  trade: {
    typicalQueries: [
      'Kostenvoranschlag anfragen',
      'Anfahrtskosten',
      'Terminvereinbarung',
      'Notdienst',
      'Garantieleistungen',
    ],
    keyResponsibilities: [
      'Auftraege entgegennehmen',
      'Dringlichkeit klaeren',
      'Rueckruf organisieren',
      'Grundlegende Preisinformationen geben',
    ],
    avoidTopics: ['Genaue Kostenangaben ohne Besichtigung', 'DIY-Anleitungen'],
    suggestedTone: 'Kompetent und loesungsorientiert, vertrauenswuerdig',
  },
  retail: {
    typicalQueries: [
      'Produktverfuegbarkeit',
      'Oeffnungszeiten',
      'Bestellungen und Lieferung',
      'Umtausch und Rueckgabe',
      'Preisanfragen',
    ],
    keyResponsibilities: [
      'Zu Produkten informieren',
      'Bestellungen aufnehmen',
      'Lieferzeiten nennen',
      'Zu Rueckgaben beraten',
    ],
    avoidTopics: ['Genaue Lagerbestaende', 'Preisverhandlungen am Telefon'],
    suggestedTone: 'Hilfsbereit und kundenorientiert',
  },
  service: {
    typicalQueries: [
      'Terminvereinbarung',
      'Leistungsumfang',
      'Preise und Kosten',
      'Erstberatung',
      'Erreichbarkeit',
    ],
    keyResponsibilities: [
      'Erstanfragen qualifizieren',
      'Rueckruf vereinbaren',
      'Zu Leistungen informieren',
      'Unterlagen anfordern',
    ],
    avoidTopics: [
      'Verbindliche Rechtsberatung',
      'Finanzielle Garantien',
      'Vertrauliche Kundendaten',
    ],
    suggestedTone: 'Professionell und kompetent, vertrauenswuerdig',
  },
  general: {
    typicalQueries: [
      'Allgemeine Informationen',
      'Kontaktmoeglichkeiten',
      'Oeffnungszeiten',
      'Angebotene Leistungen',
    ],
    keyResponsibilities: [
      'Grundlegende Fragen beantworten',
      'An richtige Stelle weiterleiten',
      'Rueckruf organisieren',
    ],
    avoidTopics: [],
    suggestedTone: 'Freundlich und hilfsbereit',
  },
};

/**
 * Detect the business type from business information
 *
 * @param businessName - Name of the business
 * @param businessDescription - Optional description
 * @param services - Array of services offered
 * @returns Detected business type
 */
export function detectBusinessType(
  businessName: string,
  businessDescription?: string,
  services?: string[]
): BusinessType {
  // Combine all text for analysis
  const combinedText = [
    businessName,
    businessDescription || '',
    ...(services || []),
  ]
    .join(' ')
    .toLowerCase();

  // Count matches for each business type
  const scores: Record<BusinessType, number> = {
    gastronomy: 0,
    salon: 0,
    medical: 0,
    trade: 0,
    retail: 0,
    service: 0,
    general: 0,
  };

  // Calculate scores based on keyword matches
  for (const [type, keywords] of Object.entries(BUSINESS_TYPE_KEYWORDS) as [
    BusinessType,
    string[],
  ][]) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword)) {
        // Boost score for matches in business name
        if (businessName.toLowerCase().includes(keyword)) {
          scores[type] += 3;
        } else {
          scores[type] += 1;
        }
      }
    }
  }

  // Find the type with the highest score
  let maxScore = 0;
  let detectedType: BusinessType = 'general';

  for (const [type, score] of Object.entries(scores) as [BusinessType, number][]) {
    if (score > maxScore && type !== 'general') {
      maxScore = score;
      detectedType = type;
    }
  }

  return detectedType;
}

/**
 * Get context guidelines for a business type
 *
 * @param businessType - The business type
 * @returns Context-specific guidelines
 */
export function getBusinessTypeContext(businessType: BusinessType): {
  typicalQueries: string[];
  keyResponsibilities: string[];
  avoidTopics: string[];
  suggestedTone: string;
} {
  return BUSINESS_TYPE_CONTEXT[businessType];
}

/**
 * Get German display name for a business type
 *
 * @param businessType - The business type
 * @returns German display name
 */
export function getBusinessTypeDisplayName(businessType: BusinessType): string {
  const displayNames: Record<BusinessType, string> = {
    gastronomy: 'Gastronomie',
    salon: 'Friseur/Kosmetik',
    medical: 'Medizin/Gesundheit',
    trade: 'Handwerk',
    retail: 'Einzelhandel',
    service: 'Dienstleistung',
    general: 'Allgemein',
  };

  return displayNames[businessType];
}
