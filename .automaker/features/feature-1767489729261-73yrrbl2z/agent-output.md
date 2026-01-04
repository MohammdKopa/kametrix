
🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "Explore this codebase to understand its structure. I need to implement a feature to \"Enhance the quality and effectiveness of generated prompts by improving context awareness, clarity, and specificity. Include better template structures and dynamic variable handling.\"\n\nPlease:\n1. Find the main project structure and key directories\n2. Identify any existing prompt generation or template-related code\n3. Look for configuration files (package.json, tsconfig, etc.)\n4. Find any existing tests to understand testing patterns\n\nBe thorough - I need to understand where prompt-related code lives and how the project is organized.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\" | head -30",
  "description": "List root directory contents"
}

🔧 Tool: Glob
Input: {
  "pattern": "*.json",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\" -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | head -40",
  "description": "Find main directories excluding node_modules and .git"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\" | grep -E \"^d\"",
  "description": "List only directories in root"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\package.json"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\" | grep -v node_modules | grep -v .next | head -50",
  "description": "List root contents excluding node_modules and .next"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\" -type d | head -50",
  "description": "List src directory structure"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.ts",
  "path": "F:\\CodeBase\\Kametrix\\src"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts"
}

🔧 Tool: Grep
Input: {
  "pattern": "prompt|template",
  "type": "ts",
  "head_limit": 30
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\system-prompt.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\tool-definitions.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.tsx",
  "path": "F:\\CodeBase\\Kametrix\\src\\components"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\dashboard\\agent-form.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\wizard\\agent-wizard.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\\components\\wizard\\steps\" -name \"*.tsx\" -type f",
  "description": "List wizard step components"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\types\\wizard.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\wizard\\steps\\knowledge-step.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\wizard\\steps\\review-step.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\generate\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\agents\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\openrouter.ts",
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\vapi\\assistants.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\openrouter.ts",
  "offset": 200
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\" -name \"*.test.ts\" -o -name \"*.test.tsx\" -o -name \"*.spec.ts\" -o -name \"*.spec.tsx\" 2>/dev/null",
  "description": "Find all test files"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\tsconfig.json"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\localization\\__tests__\\spoken-format.test.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\prisma\"",
  "description": "List prisma directory"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "offset": 100,
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"systemPrompt\\|buildSystemPrompt\\|prompt\" \"F:\\CodeBase\\Kametrix\\src\" --include=\"*.ts\" --include=\"*.tsx\" | head -20",
  "description": "Find references to prompts and system prompt"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\src\\lib\"",
  "description": "List lib directory to understand structure"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\agents\\[id]\\refresh\\route.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\" -name \"README*\" -o -name \"CHANGES*\" -o -name \"CHANGELOG*\" 2>/dev/null | head -5",
  "description": "Find documentation files"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\.planning\\config.json"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\wizard\\steps\\business-info-step.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\wizard\\steps\\greeting-step.tsx",
  "limit": 80
}

Excellent! I now have a comprehensive understanding of the codebase. Let me explore the key files in detail to understand the current implementation before planning the enhancements.

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\system-prompt.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\tool-definitions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\openrouter.ts"
}

Now let me also check the index file for prompts and look at the wizard components:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\types\\wizard.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\generate\\route.ts"
}

Now I have a solid understanding of the codebase. Let me create a todo list to track my implementation and start working on the enhancements:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance PromptConfig types for better context awareness",
      "status": "in_progress",
      "activeForm": "Enhancing PromptConfig types for better context awareness"
    },
    {
      "content": "Create business type detection utility for context awareness",
      "status": "pending",
      "activeForm": "Creating business type detection utility"
    },
    {
      "content": "Implement improved template structure with dynamic sections",
      "status": "pending",
      "activeForm": "Implementing improved template structure"
    },
    {
      "content": "Add dynamic variable handling system",
      "status": "pending",
      "activeForm": "Adding dynamic variable handling system"
    },
    {
      "content": "Improve prompt builder with clarity and specificity enhancements",
      "status": "pending",
      "activeForm": "Improving prompt builder with clarity enhancements"
    },
    {
      "content": "Update openrouter.ts with enhanced prompt generation",
      "status": "pending",
      "activeForm": "Updating openrouter.ts with enhanced generation"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Creating and running Playwright verification test"
    }
  ]
}

Let me start by enhancing the types and creating a business type detection utility:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\types.ts",
  "old_string": "/**\n * Configuration for building system prompts\n */\nexport interface PromptConfig {\n  businessName: string;\n  businessDescription?: string;\n  businessHours: string;\n  services: string[];\n  faqs: { question: string; answer: string }[];\n  policies?: string;\n  hasGoogleCalendar: boolean;\n}",
  "new_string": "/**\n * Supported business types for context-aware prompt generation\n */\nexport type BusinessType =\n  | 'gastronomy'\n  | 'salon'\n  | 'medical'\n  | 'trade'\n  | 'retail'\n  | 'service'\n  | 'general';\n\n/**\n * Dynamic variable definition for template substitution\n */\nexport interface DynamicVariable {\n  name: string;\n  value: string;\n  description?: string;\n}\n\n/**\n * FAQ entry with optional category for better organization\n */\nexport interface FAQ {\n  question: string;\n  answer: string;\n  category?: string;\n}\n\n/**\n * Contact information for the business\n */\nexport interface ContactInfo {\n  phone?: string;\n  email?: string;\n  address?: string;\n  website?: string;\n}\n\n/**\n * Extended configuration for building enhanced system prompts\n * with better context awareness, clarity, and specificity\n */\nexport interface PromptConfig {\n  // Core business information\n  businessName: string;\n  businessDescription?: string;\n  businessHours: string;\n  services: string[];\n\n  // Knowledge base\n  faqs: FAQ[];\n  policies?: string;\n\n  // Context awareness enhancements\n  businessType?: BusinessType;\n  contactInfo?: ContactInfo;\n  specialInstructions?: string;\n\n  // Dynamic variables for template substitution\n  customVariables?: DynamicVariable[];\n\n  // Integration flags\n  hasGoogleCalendar: boolean;\n\n  // Style and tone customization\n  tone?: 'formal' | 'friendly' | 'professional';\n  responseLength?: 'brief' | 'moderate' | 'detailed';\n}\n\n/**\n * Template section for modular prompt building\n */\nexport interface PromptSection {\n  id: string;\n  title: string;\n  content: string;\n  priority: number;\n  enabled: boolean;\n}\n\n/**\n * Generated prompt result with metadata\n */\nexport interface GeneratedPrompt {\n  prompt: string;\n  sections: PromptSection[];\n  variables: DynamicVariable[];\n  metadata: {\n    businessType: BusinessType;\n    totalLength: number;\n    sectionCount: number;\n    generatedAt: string;\n  };\n}"
}

Now let me create the business type detection utility:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\business-type-detector.ts",
  "content": "/**\n * Business type detection for context-aware prompt generation\n *\n * Analyzes business name, description, and services to determine\n * the industry type for tailored prompt generation.\n */\n\nimport type { BusinessType } from './types';\n\n/**\n * Industry keywords for automatic business type detection\n */\nconst BUSINESS_TYPE_KEYWORDS: Record<BusinessType, string[]> = {\n  gastronomy: [\n    'restaurant',\n    'ristorante',\n    'pizzeria',\n    'bistro',\n    'café',\n    'cafe',\n    'kaffee',\n    'bäckerei',\n    'backerei',\n    'konditorei',\n    'bar',\n    'kneipe',\n    'imbiss',\n    'döner',\n    'doner',\n    'sushi',\n    'küche',\n    'kuche',\n    'speisen',\n    'essen',\n    'koch',\n    'kulinarisch',\n    'gasthaus',\n    'wirtshaus',\n    'trattoria',\n    'catering',\n    'gastronomie',\n    'gastro',\n    'lokal',\n    'speisekarte',\n    'lieferservice',\n    'lieferdienst',\n  ],\n  salon: [\n    'friseur',\n    'frisör',\n    'frisor',\n    'salon',\n    'haare',\n    'schnitt',\n    'färben',\n    'farben',\n    'styling',\n    'kosmetik',\n    'nagel',\n    'maniküre',\n    'manikure',\n    'pediküre',\n    'pedikure',\n    'wellness',\n    'spa',\n    'massage',\n    'beauty',\n    'pflege',\n    'nagelstudio',\n    'haarstudio',\n    'barbershop',\n    'barber',\n    'makeup',\n    'schönheit',\n    'schonheit',\n  ],\n  medical: [\n    'arzt',\n    'ärztin',\n    'arztin',\n    'praxis',\n    'klinik',\n    'zahnarzt',\n    'zahnärztin',\n    'orthopäde',\n    'orthopaede',\n    'physiotherapie',\n    'physio',\n    'heilpraktiker',\n    'therapeut',\n    'psychologe',\n    'psychologin',\n    'apotheke',\n    'medizinisch',\n    'gesundheit',\n    'patient',\n    'behandlung',\n    'therapie',\n    'doktor',\n    'dr.',\n    'medizin',\n    'chirurg',\n    'krankengymnastik',\n    'osteopathie',\n    'kardiologe',\n    'dermatologe',\n    'augenarzt',\n    'hno',\n  ],\n  trade: [\n    'handwerker',\n    'elektriker',\n    'elektro',\n    'klempner',\n    'sanitär',\n    'sanitar',\n    'heizung',\n    'maler',\n    'schreiner',\n    'tischler',\n    'dachdecker',\n    'installateur',\n    'reparatur',\n    'montage',\n    'renovierung',\n    'bauarbeiten',\n    'bau',\n    'handwerk',\n    'meister',\n    'meisterbetrieb',\n    'installation',\n    'werkstatt',\n    'kfz',\n    'autowerkstatt',\n    'mechaniker',\n    'schlüsseldienst',\n    'schlussseldienst',\n    'umzug',\n    'gartenbau',\n    'fliesenleger',\n  ],\n  retail: [\n    'laden',\n    'shop',\n    'geschäft',\n    'geschaft',\n    'boutique',\n    'kaufen',\n    'verkauf',\n    'produkte',\n    'waren',\n    'sortiment',\n    'bestellung',\n    'handel',\n    'einzelhandel',\n    'markt',\n    'supermarkt',\n    'lebensmittel',\n    'drogerie',\n    'buchhandlung',\n    'bücher',\n    'bucher',\n    'elektromarkt',\n    'möbel',\n    'mobel',\n    'mode',\n    'bekleidung',\n    'schmuck',\n    'optiker',\n    'brillen',\n  ],\n  service: [\n    'beratung',\n    'service',\n    'agentur',\n    'büro',\n    'buro',\n    'versicherung',\n    'steuerberater',\n    'rechtsanwalt',\n    'anwalt',\n    'kanzlei',\n    'it',\n    'software',\n    'digital',\n    'consulting',\n    'unternehmensberatung',\n    'finanz',\n    'immobilien',\n    'makler',\n    'hausverwaltung',\n    'reinigung',\n    'reinigungsservice',\n    'fotograf',\n    'fotografin',\n    'fotografie',\n    'design',\n    'webdesign',\n    'marketing',\n    'werbung',\n    'eventplanung',\n    'veranstaltung',\n  ],\n  general: [],\n};\n\n/**\n * Context-specific guidelines for each business type\n */\nexport const BUSINESS_TYPE_CONTEXT: Record<\n  BusinessType,\n  {\n    typicalQueries: string[];\n    keyResponsibilities: string[];\n    avoidTopics: string[];\n    suggestedTone: string;\n  }\n> = {\n  gastronomy: {\n    typicalQueries: [\n      'Reservierungen und Tischverfuegbarkeit',\n      'Speisekarte und Tagesangebote',\n      'Allergien und Unvertraeglichkeiten',\n      'Lieferung und Abholung',\n      'Oeffnungszeiten und Standort',\n    ],\n    keyResponsibilities: [\n      'Reservierungen entgegennehmen',\n      'Ueber Speiseangebot informieren',\n      'Auf Allergien hinweisen und nachfragen',\n      'Lieferoptionen erklaeren',\n    ],\n    avoidTopics: ['Detaillierte Kochrezepte', 'Kritik an anderen Restaurants'],\n    suggestedTone: 'Herzlich und einladend, wie ein aufmerksamer Gastgeber',\n  },\n  salon: {\n    typicalQueries: [\n      'Terminvereinbarung und Verfuegbarkeit',\n      'Preise und Behandlungsdauer',\n      'Beratung zu Styling und Pflege',\n      'Stornierung und Umbuchung',\n      'Produktverkauf',\n    ],\n    keyResponsibilities: [\n      'Termine koordinieren',\n      'Preisinformationen geben',\n      'Zu Behandlungen beraten',\n      'Wartezeiten kommunizieren',\n    ],\n    avoidTopics: ['Medizinische Hautberatung', 'Kritik am Aussehen'],\n    suggestedTone: 'Freundlich und persoenlich, mit Fokus auf Wohlbefinden',\n  },\n  medical: {\n    typicalQueries: [\n      'Terminvereinbarung (dringend/regulaer)',\n      'Benoetigte Unterlagen',\n      'Rezeptbestellung',\n      'Ueberweisungen',\n      'Notfaelle und Bereitschaft',\n    ],\n    keyResponsibilities: [\n      'Termine effizient vergeben',\n      'Auf Unterlagen hinweisen',\n      'Dringlichkeit einschaetzen',\n      'An Notdienst verweisen wenn noetig',\n    ],\n    avoidTopics: [\n      'Medizinische Diagnosen',\n      'Behandlungsempfehlungen',\n      'Medikamentendosierungen',\n    ],\n    suggestedTone: 'Professionell und beruhigend, mit Empathie',\n  },\n  trade: {\n    typicalQueries: [\n      'Kostenvoranschlag anfragen',\n      'Anfahrtskosten',\n      'Terminvereinbarung',\n      'Notdienst',\n      'Garantieleistungen',\n    ],\n    keyResponsibilities: [\n      'Auftraege entgegennehmen',\n      'Dringlichkeit klaeren',\n      'Rueckruf organisieren',\n      'Grundlegende Preisinformationen geben',\n    ],\n    avoidTopics: ['Genaue Kostenangaben ohne Besichtigung', 'DIY-Anleitungen'],\n    suggestedTone: 'Kompetent und loesungsorientiert, vertrauenswuerdig',\n  },\n  retail: {\n    typicalQueries: [\n      'Produktverfuegbarkeit',\n      'Oeffnungszeiten',\n      'Bestellungen und Lieferung',\n      'Umtausch und Rueckgabe',\n      'Preisanfragen',\n    ],\n    keyResponsibilities: [\n      'Zu Produkten informieren',\n      'Bestellungen aufnehmen',\n      'Lieferzeiten nennen',\n      'Zu Rueckgaben beraten',\n    ],\n    avoidTopics: ['Genaue Lagerbestaende', 'Preisverhandlungen am Telefon'],\n    suggestedTone: 'Hilfsbereit und kundenorientiert',\n  },\n  service: {\n    typicalQueries: [\n      'Terminvereinbarung',\n      'Leistungsumfang',\n      'Preise und Kosten',\n      'Erstberatung',\n      'Erreichbarkeit',\n    ],\n    keyResponsibilities: [\n      'Erstanfragen qualifizieren',\n      'Rueckruf vereinbaren',\n      'Zu Leistungen informieren',\n      'Unterlagen anfordern',\n    ],\n    avoidTopics: [\n      'Verbindliche Rechtsberatung',\n      'Finanzielle Garantien',\n      'Vertrauliche Kundendaten',\n    ],\n    suggestedTone: 'Professionell und kompetent, vertrauenswuerdig',\n  },\n  general: {\n    typicalQueries: [\n      'Allgemeine Informationen',\n      'Kontaktmoeglichkeiten',\n      'Oeffnungszeiten',\n      'Angebotene Leistungen',\n    ],\n    keyResponsibilities: [\n      'Grundlegende Fragen beantworten',\n      'An richtige Stelle weiterleiten',\n      'Rueckruf organisieren',\n    ],\n    avoidTopics: [],\n    suggestedTone: 'Freundlich und hilfsbereit',\n  },\n};\n\n/**\n * Detect the business type from business information\n *\n * @param businessName - Name of the business\n * @param businessDescription - Optional description\n * @param services - Array of services offered\n * @returns Detected business type\n */\nexport function detectBusinessType(\n  businessName: string,\n  businessDescription?: string,\n  services?: string[]\n): BusinessType {\n  // Combine all text for analysis\n  const combinedText = [\n    businessName,\n    businessDescription || '',\n    ...(services || []),\n  ]\n    .join(' ')\n    .toLowerCase();\n\n  // Count matches for each business type\n  const scores: Record<BusinessType, number> = {\n    gastronomy: 0,\n    salon: 0,\n    medical: 0,\n    trade: 0,\n    retail: 0,\n    service: 0,\n    general: 0,\n  };\n\n  // Calculate scores based on keyword matches\n  for (const [type, keywords] of Object.entries(BUSINESS_TYPE_KEYWORDS) as [\n    BusinessType,\n    string[],\n  ][]) {\n    for (const keyword of keywords) {\n      if (combinedText.includes(keyword)) {\n        // Boost score for matches in business name\n        if (businessName.toLowerCase().includes(keyword)) {\n          scores[type] += 3;\n        } else {\n          scores[type] += 1;\n        }\n      }\n    }\n  }\n\n  // Find the type with the highest score\n  let maxScore = 0;\n  let detectedType: BusinessType = 'general';\n\n  for (const [type, score] of Object.entries(scores) as [BusinessType, number][]) {\n    if (score > maxScore && type !== 'general') {\n      maxScore = score;\n      detectedType = type;\n    }\n  }\n\n  return detectedType;\n}\n\n/**\n * Get context guidelines for a business type\n *\n * @param businessType - The business type\n * @returns Context-specific guidelines\n */\nexport function getBusinessTypeContext(businessType: BusinessType): {\n  typicalQueries: string[];\n  keyResponsibilities: string[];\n  avoidTopics: string[];\n  suggestedTone: string;\n} {\n  return BUSINESS_TYPE_CONTEXT[businessType];\n}\n\n/**\n * Get German display name for a business type\n *\n * @param businessType - The business type\n * @returns German display name\n */\nexport function getBusinessTypeDisplayName(businessType: BusinessType): string {\n  const displayNames: Record<BusinessType, string> = {\n    gastronomy: 'Gastronomie',\n    salon: 'Friseur/Kosmetik',\n    medical: 'Medizin/Gesundheit',\n    trade: 'Handwerk',\n    retail: 'Einzelhandel',\n    service: 'Dienstleistung',\n    general: 'Allgemein',\n  };\n\n  return displayNames[businessType];\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance PromptConfig types for better context awareness",
      "status": "completed",
      "activeForm": "Enhancing PromptConfig types for better context awareness"
    },
    {
      "content": "Create business type detection utility for context awareness",
      "status": "completed",
      "activeForm": "Creating business type detection utility"
    },
    {
      "content": "Implement improved template structure with dynamic sections",
      "status": "in_progress",
      "activeForm": "Implementing improved template structure"
    },
    {
      "content": "Add dynamic variable handling system",
      "status": "pending",
      "activeForm": "Adding dynamic variable handling system"
    },
    {
      "content": "Improve prompt builder with clarity and specificity enhancements",
      "status": "pending",
      "activeForm": "Improving prompt builder with clarity enhancements"
    },
    {
      "content": "Update openrouter.ts with enhanced prompt generation",
      "status": "pending",
      "activeForm": "Updating openrouter.ts with enhanced generation"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Creating and running Playwright verification test"
    }
  ]
}

Now let me create the dynamic variable handling system:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\variable-handler.ts",
  "content": "/**\n * Dynamic variable handling system for template substitution\n *\n * Provides flexible variable interpolation for prompt templates\n * with support for default values, formatting, and validation.\n */\n\nimport type { DynamicVariable, PromptConfig, ContactInfo } from './types';\n\n/**\n * Variable pattern for matching template variables\n * Supports: {{variableName}}, {{variableName | default: \"value\"}}, {{variableName | format: \"option\"}}\n */\nconst VARIABLE_PATTERN = /\\{\\{([^}|]+)(?:\\s*\\|\\s*([^}]+))?\\}\\}/g;\n\n/**\n * Default system variables that are always available\n */\nexport function getSystemVariables(config: PromptConfig): DynamicVariable[] {\n  const systemVars: DynamicVariable[] = [\n    {\n      name: 'businessName',\n      value: config.businessName,\n      description: 'Name des Unternehmens',\n    },\n    {\n      name: 'businessHours',\n      value: config.businessHours,\n      description: 'Oeffnungszeiten',\n    },\n    {\n      name: 'servicesCount',\n      value: String(config.services.length),\n      description: 'Anzahl der Dienstleistungen',\n    },\n    {\n      name: 'servicesList',\n      value: config.services.join(', ') || 'keine angegeben',\n      description: 'Liste aller Dienstleistungen',\n    },\n    {\n      name: 'faqCount',\n      value: String(config.faqs.length),\n      description: 'Anzahl der FAQs',\n    },\n    {\n      name: 'hasPolicies',\n      value: config.policies ? 'ja' : 'nein',\n      description: 'Ob Richtlinien vorhanden sind',\n    },\n    {\n      name: 'hasCalendar',\n      value: config.hasGoogleCalendar ? 'ja' : 'nein',\n      description: 'Ob Kalenderintegration aktiv ist',\n    },\n  ];\n\n  // Add business description if available\n  if (config.businessDescription) {\n    systemVars.push({\n      name: 'businessDescription',\n      value: config.businessDescription,\n      description: 'Beschreibung des Unternehmens',\n    });\n  }\n\n  // Add contact info variables if available\n  if (config.contactInfo) {\n    const contact = config.contactInfo;\n    if (contact.phone) {\n      systemVars.push({\n        name: 'phone',\n        value: contact.phone,\n        description: 'Telefonnummer',\n      });\n    }\n    if (contact.email) {\n      systemVars.push({\n        name: 'email',\n        value: contact.email,\n        description: 'E-Mail-Adresse',\n      });\n    }\n    if (contact.address) {\n      systemVars.push({\n        name: 'address',\n        value: contact.address,\n        description: 'Adresse',\n      });\n    }\n    if (contact.website) {\n      systemVars.push({\n        name: 'website',\n        value: contact.website,\n        description: 'Website',\n      });\n    }\n  }\n\n  // Add tone and style variables\n  if (config.tone) {\n    systemVars.push({\n      name: 'tone',\n      value: config.tone,\n      description: 'Gewaehlter Tonfall',\n    });\n  }\n\n  if (config.responseLength) {\n    systemVars.push({\n      name: 'responseLength',\n      value: config.responseLength,\n      description: 'Gewuenschte Antwortlaenge',\n    });\n  }\n\n  return systemVars;\n}\n\n/**\n * Merge system variables with custom variables\n * Custom variables take precedence over system variables\n */\nexport function mergeVariables(\n  systemVars: DynamicVariable[],\n  customVars?: DynamicVariable[]\n): Map<string, DynamicVariable> {\n  const variableMap = new Map<string, DynamicVariable>();\n\n  // Add system variables first\n  for (const variable of systemVars) {\n    variableMap.set(variable.name.toLowerCase(), variable);\n  }\n\n  // Override with custom variables\n  if (customVars) {\n    for (const variable of customVars) {\n      variableMap.set(variable.name.toLowerCase(), variable);\n    }\n  }\n\n  return variableMap;\n}\n\n/**\n * Parse variable modifiers from template syntax\n * Supports: default, format, uppercase, lowercase\n */\nfunction parseModifiers(\n  modifierString: string\n): { type: string; value: string }[] {\n  const modifiers: { type: string; value: string }[] = [];\n\n  const parts = modifierString.split('|').map((p) => p.trim());\n  for (const part of parts) {\n    const colonIndex = part.indexOf(':');\n    if (colonIndex > -1) {\n      const type = part.substring(0, colonIndex).trim();\n      const value = part\n        .substring(colonIndex + 1)\n        .trim()\n        .replace(/^[\"']|[\"']$/g, '');\n      modifiers.push({ type, value });\n    } else {\n      modifiers.push({ type: part, value: '' });\n    }\n  }\n\n  return modifiers;\n}\n\n/**\n * Apply modifiers to a variable value\n */\nfunction applyModifiers(\n  value: string,\n  modifiers: { type: string; value: string }[]\n): string {\n  let result = value;\n\n  for (const modifier of modifiers) {\n    switch (modifier.type) {\n      case 'default':\n        if (!result || result.trim() === '') {\n          result = modifier.value;\n        }\n        break;\n      case 'uppercase':\n        result = result.toUpperCase();\n        break;\n      case 'lowercase':\n        result = result.toLowerCase();\n        break;\n      case 'capitalize':\n        result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();\n        break;\n      case 'truncate':\n        const maxLength = parseInt(modifier.value, 10) || 50;\n        if (result.length > maxLength) {\n          result = result.substring(0, maxLength) + '...';\n        }\n        break;\n      case 'list':\n        // Format as bullet list\n        const separator = modifier.value || ', ';\n        result = result\n          .split(separator)\n          .map((item) => `- ${item.trim()}`)\n          .join('\\n');\n        break;\n    }\n  }\n\n  return result;\n}\n\n/**\n * Interpolate variables in a template string\n *\n * @param template - Template string with variable placeholders\n * @param variables - Map of variable name to variable definition\n * @returns Interpolated string\n */\nexport function interpolateVariables(\n  template: string,\n  variables: Map<string, DynamicVariable>\n): string {\n  return template.replace(\n    VARIABLE_PATTERN,\n    (match, variableName: string, modifierString?: string) => {\n      const normalizedName = variableName.trim().toLowerCase();\n      const variable = variables.get(normalizedName);\n\n      if (!variable) {\n        // If variable not found and no default specified, keep the placeholder\n        if (modifierString) {\n          const modifiers = parseModifiers(modifierString);\n          const defaultModifier = modifiers.find((m) => m.type === 'default');\n          if (defaultModifier) {\n            return defaultModifier.value;\n          }\n        }\n        return match;\n      }\n\n      let value = variable.value;\n\n      // Apply modifiers if present\n      if (modifierString) {\n        const modifiers = parseModifiers(modifierString);\n        value = applyModifiers(value, modifiers);\n      }\n\n      return value;\n    }\n  );\n}\n\n/**\n * Validate that all required variables are present\n *\n * @param template - Template string to check\n * @param variables - Available variables\n * @returns Array of missing variable names\n */\nexport function validateVariables(\n  template: string,\n  variables: Map<string, DynamicVariable>\n): string[] {\n  const missingVariables: string[] = [];\n  let match;\n\n  const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');\n  while ((match = pattern.exec(template)) !== null) {\n    const variableName = match[1].trim().toLowerCase();\n    const modifierString = match[2];\n\n    if (!variables.has(variableName)) {\n      // Check if there's a default modifier\n      const hasDefault =\n        modifierString && modifierString.includes('default:');\n      if (!hasDefault) {\n        missingVariables.push(variableName);\n      }\n    }\n  }\n\n  return [...new Set(missingVariables)];\n}\n\n/**\n * Extract all variable names from a template\n *\n * @param template - Template string to analyze\n * @returns Array of variable names found\n */\nexport function extractVariableNames(template: string): string[] {\n  const variableNames: string[] = [];\n  let match;\n\n  const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');\n  while ((match = pattern.exec(template)) !== null) {\n    variableNames.push(match[1].trim());\n  }\n\n  return [...new Set(variableNames)];\n}\n\n/**\n * Create a variable context for prompt generation\n *\n * @param config - Prompt configuration\n * @returns Complete variable map ready for interpolation\n */\nexport function createVariableContext(\n  config: PromptConfig\n): Map<string, DynamicVariable> {\n  const systemVars = getSystemVariables(config);\n  return mergeVariables(systemVars, config.customVariables);\n}\n"
}

Now let me create the improved template structure system:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\template-builder.ts",
  "content": "/**\n * Enhanced template builder for modular prompt construction\n *\n * Provides a flexible, section-based approach to building prompts\n * with dynamic content injection and context awareness.\n */\n\nimport type {\n  PromptConfig,\n  PromptSection,\n  BusinessType,\n  DynamicVariable,\n} from './types';\nimport { detectBusinessType, getBusinessTypeContext, getBusinessTypeDisplayName } from './business-type-detector';\nimport { createVariableContext, interpolateVariables } from './variable-handler';\n\n/**\n * Template section IDs for consistent referencing\n */\nexport const SECTION_IDS = {\n  DATE_HEADER: 'date-header',\n  IDENTITY: 'identity',\n  CONTEXT: 'context',\n  BUSINESS_INFO: 'business-info',\n  CONTACT: 'contact',\n  FAQ: 'faq',\n  POLICIES: 'policies',\n  CALENDAR: 'calendar',\n  RESPONSIBILITIES: 'responsibilities',\n  BOUNDARIES: 'boundaries',\n  STYLE: 'style',\n  SPECIAL_INSTRUCTIONS: 'special-instructions',\n} as const;\n\n/**\n * Build the date header section with Vapi dynamic variables\n */\nfunction buildDateHeaderSection(): PromptSection {\n  return {\n    id: SECTION_IDS.DATE_HEADER,\n    title: 'AKTUELLES DATUM UND UHRZEIT',\n    content: `Heute: {{\"now\" | date: \"%d.%m.%Y\", \"Europe/Berlin\"}} (ISO: {{\"now\" | date: \"%Y-%m-%d\", \"Europe/Berlin\"}})\nUhrzeit: {{\"now\" | date: \"%H:%M\", \"Europe/Berlin\"}} Uhr\nWochentag: {{\"now\" | date: \"%A\", \"Europe/Berlin\"}}\nJahr: {{\"now\" | date: \"%Y\", \"Europe/Berlin\"}}\n\nWICHTIG - DATUMSREGELN:\n- Das aktuelle Jahr ist {{\"now\" | date: \"%Y\", \"Europe/Berlin\"}} - NIEMALS 2023 oder 2024 verwenden!\n- Wenn der Kunde \"morgen\" sagt, berechne das korrekte Datum basierend auf heute\n- Wenn der Kunde \"Montag\" sagt, nimm den NAECHSTEN Montag (nicht vergangene)\n- Uebergib Datumsangaben im Format JJJJ-MM-TT an die Tools`,\n    priority: 100,\n    enabled: true,\n  };\n}\n\n/**\n * Build the identity section with enhanced context\n */\nfunction buildIdentitySection(config: PromptConfig, businessType: BusinessType): PromptSection {\n  const typeDisplayName = getBusinessTypeDisplayName(businessType);\n\n  let content = `Sie sind der freundliche KI-Telefonassistent fuer {{businessName}}.`;\n\n  if (config.businessDescription) {\n    content += `\\n\\nUeber das Unternehmen:\\n{{businessDescription}}`;\n  }\n\n  content += `\\n\\nBranche: ${typeDisplayName}`;\n\n  return {\n    id: SECTION_IDS.IDENTITY,\n    title: 'Identity',\n    content,\n    priority: 90,\n    enabled: true,\n  };\n}\n\n/**\n * Build context awareness section based on business type\n */\nfunction buildContextSection(businessType: BusinessType): PromptSection {\n  const context = getBusinessTypeContext(businessType);\n\n  let content = `Als KI-Assistent in dieser Branche bearbeiten Sie typischerweise Anfragen zu:\\n`;\n  content += context.typicalQueries.map((q) => `- ${q}`).join('\\n');\n\n  return {\n    id: SECTION_IDS.CONTEXT,\n    title: 'Kontext und Aufgaben',\n    content,\n    priority: 85,\n    enabled: true,\n  };\n}\n\n/**\n * Build business information section\n */\nfunction buildBusinessInfoSection(config: PromptConfig): PromptSection {\n  let content = `- Firmenname: {{businessName}}`;\n  content += `\\n- Oeffnungszeiten: {{businessHours}}`;\n\n  if (config.services.length > 0) {\n    content += `\\n- Dienstleistungen:\\n`;\n    content += config.services.map((s) => `  * ${s}`).join('\\n');\n  }\n\n  return {\n    id: SECTION_IDS.BUSINESS_INFO,\n    title: 'Geschaeftsinformationen',\n    content,\n    priority: 80,\n    enabled: true,\n  };\n}\n\n/**\n * Build contact information section\n */\nfunction buildContactSection(config: PromptConfig): PromptSection {\n  const lines: string[] = [];\n\n  if (config.contactInfo?.phone) {\n    lines.push(`- Telefon: {{phone}}`);\n  }\n  if (config.contactInfo?.email) {\n    lines.push(`- E-Mail: {{email}}`);\n  }\n  if (config.contactInfo?.address) {\n    lines.push(`- Adresse: {{address}}`);\n  }\n  if (config.contactInfo?.website) {\n    lines.push(`- Website: {{website}}`);\n  }\n\n  return {\n    id: SECTION_IDS.CONTACT,\n    title: 'Kontaktinformationen',\n    content: lines.length > 0 ? lines.join('\\n') : 'Keine Kontaktdaten hinterlegt.',\n    priority: 75,\n    enabled: lines.length > 0,\n  };\n}\n\n/**\n * Build FAQ section with improved formatting\n */\nfunction buildFAQSection(config: PromptConfig): PromptSection {\n  if (config.faqs.length === 0) {\n    return {\n      id: SECTION_IDS.FAQ,\n      title: 'Haeufige Fragen',\n      content: '',\n      priority: 70,\n      enabled: false,\n    };\n  }\n\n  // Group FAQs by category if categories are present\n  const categorizedFAQs = new Map<string, typeof config.faqs>();\n\n  for (const faq of config.faqs) {\n    const category = faq.category || 'Allgemein';\n    if (!categorizedFAQs.has(category)) {\n      categorizedFAQs.set(category, []);\n    }\n    categorizedFAQs.get(category)!.push(faq);\n  }\n\n  let content = '';\n\n  if (categorizedFAQs.size === 1 && categorizedFAQs.has('Allgemein')) {\n    // No categories, simple list\n    content = config.faqs\n      .map((faq) => `FRAGE: ${faq.question}\\nANTWORT: ${faq.answer}`)\n      .join('\\n\\n');\n  } else {\n    // With categories\n    for (const [category, faqs] of categorizedFAQs) {\n      content += `\\n--- ${category} ---\\n`;\n      content += faqs\n        .map((faq) => `FRAGE: ${faq.question}\\nANTWORT: ${faq.answer}`)\n        .join('\\n\\n');\n      content += '\\n';\n    }\n  }\n\n  return {\n    id: SECTION_IDS.FAQ,\n    title: 'Haeufige Fragen',\n    content: content.trim(),\n    priority: 70,\n    enabled: true,\n  };\n}\n\n/**\n * Build policies section\n */\nfunction buildPoliciesSection(config: PromptConfig): PromptSection {\n  return {\n    id: SECTION_IDS.POLICIES,\n    title: 'Richtlinien',\n    content: config.policies || '',\n    priority: 65,\n    enabled: !!config.policies,\n  };\n}\n\n/**\n * Build calendar functions section\n */\nfunction buildCalendarSection(): PromptSection {\n  return {\n    id: SECTION_IDS.CALENDAR,\n    title: 'Kalender-Funktionen',\n    content: `VERFUEGBARE TOOLS:\n- check_availability: Pruefen Sie die Kalenderverfuegbarkeit fuer ein bestimmtes Datum\n- book_appointment: Buchen Sie einen Termin im Kalender\n\nBUCHUNGSPROZESS:\n1. Immer zuerst die Verfuegbarkeit pruefen (check_availability)\n2. Freie Zeiten dem Anrufer nennen\n3. Alle erforderlichen Daten erfragen:\n   - Datum und Uhrzeit (erforderlich)\n   - Vollstaendiger Name (erforderlich)\n   - Telefonnummer (optional, aber empfohlen)\n   - E-Mail (optional)\n4. Details vor der Buchung zusammenfassen und bestaetigen\n5. Termin buchen (book_appointment)\n6. Buchungsbestaetigung geben\n\nWICHTIGE HINWEISE:\n- Relative Datumsangaben (morgen, naechsten Montag) anhand des aktuellen Datums berechnen\n- Bei unklaren Zeiten nachfragen\n- Nie ohne Bestaetigung des Anrufers buchen`,\n    priority: 60,\n    enabled: true,\n  };\n}\n\n/**\n * Build responsibilities section based on business type\n */\nfunction buildResponsibilitiesSection(businessType: BusinessType): PromptSection {\n  const context = getBusinessTypeContext(businessType);\n\n  let content = 'Ihre Hauptaufgaben:\\n';\n  content += context.keyResponsibilities.map((r) => `- ${r}`).join('\\n');\n\n  return {\n    id: SECTION_IDS.RESPONSIBILITIES,\n    title: 'Aufgabenbereich',\n    content,\n    priority: 55,\n    enabled: true,\n  };\n}\n\n/**\n * Build boundaries section for topics to avoid\n */\nfunction buildBoundariesSection(businessType: BusinessType): PromptSection {\n  const context = getBusinessTypeContext(businessType);\n\n  if (context.avoidTopics.length === 0) {\n    return {\n      id: SECTION_IDS.BOUNDARIES,\n      title: 'Grenzen',\n      content: '',\n      priority: 50,\n      enabled: false,\n    };\n  }\n\n  let content = 'Folgende Themen sollten Sie NICHT behandeln:\\n';\n  content += context.avoidTopics.map((t) => `- ${t}`).join('\\n');\n  content += '\\n\\nBei solchen Anfragen: Hoeflich erklaeren, dass Sie dafuer nicht zustaendig sind und anbieten, einen Rueckruf zu organisieren.';\n\n  return {\n    id: SECTION_IDS.BOUNDARIES,\n    title: 'Grenzen',\n    content,\n    priority: 50,\n    enabled: true,\n  };\n}\n\n/**\n * Build style section with configurable tone\n */\nfunction buildStyleSection(config: PromptConfig, businessType: BusinessType): PromptSection {\n  const context = getBusinessTypeContext(businessType);\n\n  // Determine response length guidance\n  let lengthGuidance = 'Halten Sie Antworten kurz (max 2-3 Saetze)';\n  if (config.responseLength === 'brief') {\n    lengthGuidance = 'Halten Sie Antworten sehr kurz (max 1-2 Saetze)';\n  } else if (config.responseLength === 'detailed') {\n    lengthGuidance = 'Geben Sie ausfuehrliche Antworten wenn noetig (3-4 Saetze)';\n  }\n\n  // Determine tone guidance\n  let toneGuidance = context.suggestedTone;\n  if (config.tone === 'formal') {\n    toneGuidance = 'Sehr formell und geschaeftsmaessig';\n  } else if (config.tone === 'friendly') {\n    toneGuidance = 'Besonders herzlich und warmherzig';\n  }\n\n  const content = `KOMMUNIKATIONSSTIL:\n- Tonfall: ${toneGuidance}\n- Sprechen Sie Anrufer IMMER mit \"Sie\" an (formell)\n- Seien Sie freundlich, professionell und praezise\n- ${lengthGuidance}\n- Natuerlich fuer Telefongespraeche sprechen\n- Keine Markdown-Formatierung verwenden\n\nREAKTION AUF UNBEKANNTES:\n- Bei Fragen, die Sie nicht beantworten koennen, sagen Sie hoeflich, dass Sie die Information nicht haben\n- Bieten Sie an, einen Rueckruf durch einen Mitarbeiter zu organisieren\n- Erfragen Sie dafuer Name und Rueckrufnummer\n\nSPRACHLICHE QUALITAET:\n- Verwenden Sie korrekte deutsche Grammatik\n- Vermeiden Sie Fuellwoerter und Wiederholungen\n- Sprechen Sie klar und deutlich`;\n\n  return {\n    id: SECTION_IDS.STYLE,\n    title: 'Kommunikationsstil',\n    content,\n    priority: 40,\n    enabled: true,\n  };\n}\n\n/**\n * Build special instructions section\n */\nfunction buildSpecialInstructionsSection(config: PromptConfig): PromptSection {\n  return {\n    id: SECTION_IDS.SPECIAL_INSTRUCTIONS,\n    title: 'Besondere Anweisungen',\n    content: config.specialInstructions || '',\n    priority: 30,\n    enabled: !!config.specialInstructions,\n  };\n}\n\n/**\n * Build all prompt sections based on configuration\n */\nexport function buildPromptSections(config: PromptConfig): PromptSection[] {\n  // Detect business type if not provided\n  const businessType =\n    config.businessType ||\n    detectBusinessType(config.businessName, config.businessDescription, config.services);\n\n  const sections: PromptSection[] = [];\n\n  // Add date header for calendar-enabled agents\n  if (config.hasGoogleCalendar) {\n    sections.push(buildDateHeaderSection());\n  }\n\n  // Core sections\n  sections.push(buildIdentitySection(config, businessType));\n  sections.push(buildContextSection(businessType));\n  sections.push(buildBusinessInfoSection(config));\n  sections.push(buildContactSection(config));\n  sections.push(buildFAQSection(config));\n  sections.push(buildPoliciesSection(config));\n\n  // Calendar section\n  if (config.hasGoogleCalendar) {\n    sections.push(buildCalendarSection());\n  }\n\n  // Behavioral sections\n  sections.push(buildResponsibilitiesSection(businessType));\n  sections.push(buildBoundariesSection(businessType));\n  sections.push(buildStyleSection(config, businessType));\n\n  // Special instructions\n  if (config.specialInstructions) {\n    sections.push(buildSpecialInstructionsSection(config));\n  }\n\n  // Sort by priority (highest first) and filter enabled sections\n  return sections\n    .filter((section) => section.enabled)\n    .sort((a, b) => b.priority - a.priority);\n}\n\n/**\n * Render all sections into a complete prompt string\n */\nexport function renderSections(\n  sections: PromptSection[],\n  variables: Map<string, DynamicVariable>\n): string {\n  const renderedParts: string[] = [];\n\n  for (const section of sections) {\n    const interpolatedContent = interpolateVariables(section.content, variables);\n\n    if (interpolatedContent.trim()) {\n      renderedParts.push(`[${section.title}]`);\n      renderedParts.push(interpolatedContent);\n      renderedParts.push('');\n    }\n  }\n\n  return renderedParts.join('\\n').trim();\n}\n\n/**\n * Build a complete prompt from configuration\n *\n * This is the main entry point for enhanced prompt generation.\n */\nexport function buildEnhancedPrompt(config: PromptConfig): {\n  prompt: string;\n  sections: PromptSection[];\n  variables: DynamicVariable[];\n  metadata: {\n    businessType: BusinessType;\n    totalLength: number;\n    sectionCount: number;\n    generatedAt: string;\n  };\n} {\n  // Detect business type\n  const businessType =\n    config.businessType ||\n    detectBusinessType(config.businessName, config.businessDescription, config.services);\n\n  // Build sections\n  const sections = buildPromptSections(config);\n\n  // Create variable context\n  const variableContext = createVariableContext(config);\n  const variables = Array.from(variableContext.values());\n\n  // Render the prompt\n  const prompt = renderSections(sections, variableContext);\n\n  return {\n    prompt,\n    sections,\n    variables,\n    metadata: {\n      businessType,\n      totalLength: prompt.length,\n      sectionCount: sections.length,\n      generatedAt: new Date().toISOString(),\n    },\n  };\n}\n"
}

Now let me update the main system-prompt.ts to use the enhanced functionality while maintaining backwards compatibility:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\system-prompt.ts",
  "old_string": "/**\n * System prompt builder for voice AI assistants\n *\n * Single source of truth for all system prompt generation.\n * Uses Vapi dynamic variables for real-time date/time:\n * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage\n */\n\nimport type { PromptConfig } from './types';\n\n/**\n * Build the date header with Vapi dynamic variables\n *\n * These variables are substituted by Vapi at call time, ensuring\n * the AI always knows the current date when booking appointments.\n */\nexport function buildDateHeader(): string {\n  return `[AKTUELLES DATUM UND UHRZEIT]\nHeute: {{\"now\" | date: \"%d.%m.%Y\", \"Europe/Berlin\"}} (ISO: {{\"now\" | date: \"%Y-%m-%d\", \"Europe/Berlin\"}})\nUhrzeit: {{\"now\" | date: \"%H:%M\", \"Europe/Berlin\"}} Uhr\nWochentag: {{\"now\" | date: \"%A\", \"Europe/Berlin\"}}\nJahr: {{\"now\" | date: \"%Y\", \"Europe/Berlin\"}}\n\nWICHTIG - DATUMSREGELN:\n- Das aktuelle Jahr ist {{\"now\" | date: \"%Y\", \"Europe/Berlin\"}} - NIEMALS 2023 oder 2024 verwenden!\n- Wenn der Kunde \"morgen\" sagt, berechne das korrekte Datum basierend auf heute\n- Wenn der Kunde \"Montag\" sagt, nimm den NAECHSTEN Montag (nicht vergangene)\n- Uebergib Datumsangaben im Format JJJJ-MM-TT an die Tools\n\n`;\n}\n\n/**\n * Build a complete system prompt for a voice AI assistant\n *\n * Uses section-based structure for LLM parsing clarity:\n * - [AKTUELLES DATUM...] - Date header (calendar-enabled only)\n * - [Identity] - Who the assistant is\n * - [Geschaeftsinformationen] - Business details\n * - [Haeufige Fragen] - FAQ section (if any)\n * - [Kalender-Funktionen] - Calendar tools (if enabled)\n * - [Style] - Voice-optimized response guidelines\n *\n * All content is in German Sie-form for professional business communication.\n *\n * @param config - Business configuration for the prompt\n * @returns Complete system prompt string\n */\nexport function buildSystemPrompt(config: PromptConfig): string {\n  const sections: string[] = [];\n\n  // Date header (only for calendar-enabled agents)\n  if (config.hasGoogleCalendar) {\n    sections.push(buildDateHeader());\n  }\n\n  // Identity section\n  sections.push('[Identity]');\n  sections.push(`Sie sind der KI-Assistent fuer ${config.businessName}.`);\n  if (config.businessDescription) {\n    sections.push(config.businessDescription);\n  }\n\n  // Business info section\n  sections.push('');\n  sections.push('[Geschaeftsinformationen]');\n  sections.push(`- Firmenname: ${config.businessName}`);\n  sections.push(`- Oeffnungszeiten: ${config.businessHours}`);\n  if (config.services.length > 0) {\n    sections.push(`- Dienstleistungen: ${config.services.join(', ')}`);\n  }\n\n  // FAQ section (conditional)\n  if (config.faqs.length > 0) {\n    sections.push('');\n    sections.push('[Haeufige Fragen]');\n    config.faqs.forEach((faq) => {\n      sections.push(`F: ${faq.question}`);\n      sections.push(`A: ${faq.answer}`);\n    });\n  }\n\n  // Policies section (conditional)\n  if (config.policies) {\n    sections.push('');\n    sections.push('[Richtlinien]');\n    sections.push(config.policies);\n  }\n\n  // Calendar section (conditional)\n  if (config.hasGoogleCalendar) {\n    sections.push('');\n    sections.push('[Kalender-Funktionen]');\n    sections.push('- Verfuegbarkeit pruefen mit check_availability');\n    sections.push('- Termine buchen mit book_appointment');\n    sections.push(\n      '- Bei Buchungen erfragen: Datum, Uhrzeit, Name (erforderlich), Telefon (optional), E-Mail (optional)'\n    );\n    sections.push('- Details vor Buchung bestaetigen');\n    sections.push('- Relative Datumsangaben (morgen, naechsten Montag) anhand des aktuellen Datums berechnen');\n  }\n\n  // Style section - voice-optimized guidelines\n  sections.push('');\n  sections.push('[Style]');\n  sections.push('- Sprechen Sie Anrufer IMMER mit \"Sie\" an (formell)');\n  sections.push('- Seien Sie freundlich, professionell und praezise');\n  sections.push('- Halten Sie Antworten kurz (max 2-3 Saetze)');\n  sections.push('- Natuerlich fuer Telefongespraeche sprechen');\n  sections.push('- Keine Markdown-Formatierung verwenden');\n  sections.push('- Wenn Sie etwas nicht wissen, sagen Sie hoeflich, dass sich jemand melden wird');\n\n  return sections.join('\\n');\n}",
  "new_string": "/**\n * System prompt builder for voice AI assistants\n *\n * Single source of truth for all system prompt generation.\n * Uses Vapi dynamic variables for real-time date/time:\n * https://docs.vapi.ai/assistants/dynamic-variables#advanced-date-and-time-usage\n *\n * Enhanced with:\n * - Context-aware business type detection\n * - Dynamic variable substitution\n * - Modular section-based templates\n * - Improved clarity and specificity\n */\n\nimport type { PromptConfig, GeneratedPrompt, BusinessType } from './types';\nimport { buildEnhancedPrompt } from './template-builder';\nimport { detectBusinessType } from './business-type-detector';\n\n/**\n * Build the date header with Vapi dynamic variables\n *\n * These variables are substituted by Vapi at call time, ensuring\n * the AI always knows the current date when booking appointments.\n */\nexport function buildDateHeader(): string {\n  return `[AKTUELLES DATUM UND UHRZEIT]\nHeute: {{\"now\" | date: \"%d.%m.%Y\", \"Europe/Berlin\"}} (ISO: {{\"now\" | date: \"%Y-%m-%d\", \"Europe/Berlin\"}})\nUhrzeit: {{\"now\" | date: \"%H:%M\", \"Europe/Berlin\"}} Uhr\nWochentag: {{\"now\" | date: \"%A\", \"Europe/Berlin\"}}\nJahr: {{\"now\" | date: \"%Y\", \"Europe/Berlin\"}}\n\nWICHTIG - DATUMSREGELN:\n- Das aktuelle Jahr ist {{\"now\" | date: \"%Y\", \"Europe/Berlin\"}} - NIEMALS 2023 oder 2024 verwenden!\n- Wenn der Kunde \"morgen\" sagt, berechne das korrekte Datum basierend auf heute\n- Wenn der Kunde \"Montag\" sagt, nimm den NAECHSTEN Montag (nicht vergangene)\n- Uebergib Datumsangaben im Format JJJJ-MM-TT an die Tools\n\n`;\n}\n\n/**\n * Build a complete system prompt for a voice AI assistant (Legacy API)\n *\n * Uses section-based structure for LLM parsing clarity:\n * - [AKTUELLES DATUM...] - Date header (calendar-enabled only)\n * - [Identity] - Who the assistant is\n * - [Geschaeftsinformationen] - Business details\n * - [Haeufige Fragen] - FAQ section (if any)\n * - [Kalender-Funktionen] - Calendar tools (if enabled)\n * - [Style] - Voice-optimized response guidelines\n *\n * All content is in German Sie-form for professional business communication.\n *\n * @param config - Business configuration for the prompt\n * @returns Complete system prompt string\n */\nexport function buildSystemPrompt(config: PromptConfig): string {\n  // Use the enhanced prompt builder for improved context awareness\n  const result = buildEnhancedPrompt(config);\n  return result.prompt;\n}\n\n/**\n * Build a complete system prompt with full metadata (Enhanced API)\n *\n * Returns the prompt along with section details, variables used,\n * and generation metadata for debugging and analytics.\n *\n * @param config - Business configuration for the prompt\n * @returns Generated prompt with full metadata\n */\nexport function buildSystemPromptWithMetadata(config: PromptConfig): GeneratedPrompt {\n  return buildEnhancedPrompt(config);\n}\n\n/**\n * Detect business type from configuration\n *\n * Utility function to detect the business type without building the full prompt.\n * Useful for UI display and conditional logic.\n *\n * @param config - Business configuration\n * @returns Detected business type\n */\nexport function getBusinessType(config: PromptConfig): BusinessType {\n  return config.businessType || detectBusinessType(\n    config.businessName,\n    config.businessDescription,\n    config.services\n  );\n}\n\n/**\n * Validate prompt configuration\n *\n * Checks for common issues in the configuration that could\n * result in a suboptimal prompt.\n *\n * @param config - Business configuration to validate\n * @returns Array of warning messages (empty if valid)\n */\nexport function validatePromptConfig(config: PromptConfig): string[] {\n  const warnings: string[] = [];\n\n  if (!config.businessName.trim()) {\n    warnings.push('Firmenname ist erforderlich');\n  }\n\n  if (!config.businessHours.trim()) {\n    warnings.push('Oeffnungszeiten sollten angegeben werden');\n  }\n\n  if (config.services.length === 0) {\n    warnings.push('Mindestens eine Dienstleistung sollte angegeben werden');\n  }\n\n  if (config.faqs.length === 0) {\n    warnings.push('FAQs verbessern die Qualitaet der Antworten erheblich');\n  }\n\n  if (config.faqs.length > 0) {\n    const emptyFaqs = config.faqs.filter(\n      (faq) => !faq.question.trim() || !faq.answer.trim()\n    );\n    if (emptyFaqs.length > 0) {\n      warnings.push(`${emptyFaqs.length} FAQ(s) haben leere Fragen oder Antworten`);\n    }\n  }\n\n  if (config.hasGoogleCalendar && !config.businessHours.trim()) {\n    warnings.push('Bei aktiviertem Kalender sind Oeffnungszeiten besonders wichtig');\n  }\n\n  return warnings;\n}"
}

Now let me update the index.ts to export all the new functionality:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\index.ts",
  "old_string": "/**\n * Prompts module - Single source of truth for all system prompt and tool definitions\n *\n * This module consolidates prompt building logic that was previously\n * duplicated across:\n * - src/lib/vapi/assistants.ts\n * - src/app/api/agents/route.ts\n * - src/app/api/webhooks/vapi/route.ts\n */\n\nexport { buildSystemPrompt, buildDateHeader } from './system-prompt';\nexport { buildCalendarTools, CALENDAR_TOOL_NAMES } from './tool-definitions';\nexport type { PromptConfig } from './types';",
  "new_string": "/**\n * Prompts module - Single source of truth for all system prompt and tool definitions\n *\n * This module consolidates prompt building logic that was previously\n * duplicated across:\n * - src/lib/vapi/assistants.ts\n * - src/app/api/agents/route.ts\n * - src/app/api/webhooks/vapi/route.ts\n *\n * Enhanced with:\n * - Context-aware business type detection\n * - Dynamic variable substitution system\n * - Modular section-based templates\n * - Improved clarity and specificity\n */\n\n// Core prompt building functions\nexport {\n  buildSystemPrompt,\n  buildSystemPromptWithMetadata,\n  buildDateHeader,\n  getBusinessType,\n  validatePromptConfig,\n} from './system-prompt';\n\n// Calendar tool definitions\nexport { buildCalendarTools, CALENDAR_TOOL_NAMES } from './tool-definitions';\n\n// Business type detection\nexport {\n  detectBusinessType,\n  getBusinessTypeContext,\n  getBusinessTypeDisplayName,\n  BUSINESS_TYPE_CONTEXT,\n} from './business-type-detector';\n\n// Template builder utilities\nexport {\n  buildPromptSections,\n  buildEnhancedPrompt,\n  renderSections,\n  SECTION_IDS,\n} from './template-builder';\n\n// Variable handling utilities\nexport {\n  getSystemVariables,\n  mergeVariables,\n  interpolateVariables,\n  validateVariables,\n  extractVariableNames,\n  createVariableContext,\n} from './variable-handler';\n\n// Types\nexport type {\n  PromptConfig,\n  BusinessType,\n  DynamicVariable,\n  FAQ,\n  ContactInfo,\n  PromptSection,\n  GeneratedPrompt,\n} from './types';"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance PromptConfig types for better context awareness",
      "status": "completed",
      "activeForm": "Enhancing PromptConfig types for better context awareness"
    },
    {
      "content": "Create business type detection utility for context awareness",
      "status": "completed",
      "activeForm": "Creating business type detection utility"
    },
    {
      "content": "Implement improved template structure with dynamic sections",
      "status": "completed",
      "activeForm": "Implementing improved template structure"
    },
    {
      "content": "Add dynamic variable handling system",
      "status": "completed",
      "activeForm": "Adding dynamic variable handling system"
    },
    {
      "content": "Improve prompt builder with clarity and specificity enhancements",
      "status": "completed",
      "activeForm": "Improving prompt builder with clarity enhancements"
    },
    {
      "content": "Update openrouter.ts with enhanced prompt generation",
      "status": "in_progress",
      "activeForm": "Updating openrouter.ts with enhanced generation"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "pending",
      "activeForm": "Creating and running Playwright verification test"
    }
  ]
}

Now let me update the openrouter.ts to use the enhanced prompt generation and business type detection:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\openrouter.ts",
  "old_string": "import { WizardState } from '@/types/wizard';\n\nconst OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';\n\ninterface OpenRouterMessage {\n  role: 'system' | 'user' | 'assistant';\n  content: string;\n}\n\ninterface OpenRouterResponse {\n  choices: {\n    message: {\n      content: string;\n    };\n  }[];\n}\n\nasync function callOpenRouter(messages: OpenRouterMessage[], model = 'openai/gpt-4o-mini'): Promise<string> {\n  const apiKey = process.env.OPENROUTER_API_KEY;\n\n  if (!apiKey) {\n    throw new Error('OPENROUTER_API_KEY not configured');\n  }\n\n  const response = await fetch(OPENROUTER_API_URL, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${apiKey}`,\n      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',\n      'X-Title': 'Kametrix',\n    },\n    body: JSON.stringify({\n      model,\n      messages,\n      temperature: 0.7,\n      max_tokens: 2000,\n    }),\n  });\n\n  if (!response.ok) {\n    const error = await response.text();\n    throw new Error(`OpenRouter API error: ${error}`);\n  }\n\n  const data: OpenRouterResponse = await response.json();\n  return data.choices[0]?.message?.content || '';\n}\n\nexport interface GeneratedContent {\n  faqs: { question: string; answer: string }[];\n  policies: string;\n  greeting: string;\n  endCallMessage: string;\n}",
  "new_string": "import { WizardState } from '@/types/wizard';\nimport {\n  detectBusinessType,\n  getBusinessTypeContext,\n  getBusinessTypeDisplayName,\n  type BusinessType,\n} from '@/lib/prompts';\n\nconst OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';\n\ninterface OpenRouterMessage {\n  role: 'system' | 'user' | 'assistant';\n  content: string;\n}\n\ninterface OpenRouterResponse {\n  choices: {\n    message: {\n      content: string;\n    };\n  }[];\n}\n\nasync function callOpenRouter(messages: OpenRouterMessage[], model = 'openai/gpt-4o-mini'): Promise<string> {\n  const apiKey = process.env.OPENROUTER_API_KEY;\n\n  if (!apiKey) {\n    throw new Error('OPENROUTER_API_KEY not configured');\n  }\n\n  const response = await fetch(OPENROUTER_API_URL, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${apiKey}`,\n      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',\n      'X-Title': 'Kametrix',\n    },\n    body: JSON.stringify({\n      model,\n      messages,\n      temperature: 0.7,\n      max_tokens: 2000,\n    }),\n  });\n\n  if (!response.ok) {\n    const error = await response.text();\n    throw new Error(`OpenRouter API error: ${error}`);\n  }\n\n  const data: OpenRouterResponse = await response.json();\n  return data.choices[0]?.message?.content || '';\n}\n\nexport interface GeneratedContent {\n  faqs: { question: string; answer: string; category?: string }[];\n  policies: string;\n  greeting: string;\n  endCallMessage: string;\n  detectedBusinessType?: BusinessType;\n}\n\n/**\n * Build context-aware system prompt for FAQ generation\n * Uses centralized business type detection for consistency\n */\nfunction buildFAQGenerationPrompt(businessType: BusinessType): string {\n  const context = getBusinessTypeContext(businessType);\n  const displayName = getBusinessTypeDisplayName(businessType);\n\n  return `Du bist Experte für die Erstellung von Inhalten für KI-Sprachassistenten, die Telefonanrufe für kleine Unternehmen in Deutschland bearbeiten.\n\nERKANNTE BRANCHE: ${displayName}\n\nTYPISCHE ANFRAGEN IN DIESER BRANCHE:\n${context.typicalQueries.map((q) => `- ${q}`).join('\\n')}\n\nHAUPTAUFGABEN DES ASSISTENTEN:\n${context.keyResponsibilities.map((r) => `- ${r}`).join('\\n')}\n\nEMPFOHLENER TONFALL: ${context.suggestedTone}\n\nTONFALL - HERZLICH, NICHT FÖRMLICH:\nBeispiele für HERZLICHEN Ton (so soll es klingen):\n- \"Gerne helfe ich Ihnen weiter!\"\n- \"Das freut mich, dass Sie anrufen!\"\n- \"Selbstverständlich, bei uns können Sie...\"\n- \"Wunderbar, da kann ich Ihnen sagen...\"\n\nBeispiele für ZU FÖRMLICHEN Ton (so NICHT):\n- \"Wir bitten Sie zur Kenntnis zu nehmen, dass...\"\n- \"Gemäß unseren Richtlinien...\"\n\nWICHTIGE REGELN:\n- Alle Inhalte auf Deutsch mit Sie-Form\n- Schreibe so, wie es natürlich am Telefon klingt\n- FAQs müssen spezifisch für die erkannte Branche sein\n- Antworten kurz und praezise (2-3 Saetze maximal)\n\nAntworte mit gültigem JSON:\n{\n  \"faqs\": [\n    { \"question\": \"...\", \"answer\": \"...\", \"category\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\", \"category\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\", \"category\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\", \"category\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\", \"category\": \"...\" }\n  ],\n  \"policies\": \"...\",\n  \"greeting\": \"...\",\n  \"endCallMessage\": \"...\"\n}`;\n}"
}

Now let me update the `generateWizardContent` function to use the new centralized business type detection:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\openrouter.ts",
  "old_string": "export async function generateWizardContent(\n  businessInfo: WizardState['businessInfo']\n): Promise<GeneratedContent> {\n  const { businessName, businessDescription, businessHours, services } = businessInfo;\n\n  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';\n\n  const systemPrompt = `Du bist Experte für die Erstellung von Inhalten für KI-Sprachassistenten, die Telefonanrufe für kleine Unternehmen in Deutschland bearbeiten.\n\nSCHRITT 1 - BRANCHENERKENNUNG:\nAnalysiere zuerst den Unternehmenstyp anhand von Schlüsselwörtern:\n\nGASTRONOMIE erkennen an: Restaurant, Ristorante, Pizzeria, Bistro, Café, Kaffee, Bäckerei, Konditorei, Bar, Kneipe, Imbiss, Döner, Sushi, Küche, Speisen, Essen, Koch, kulinarisch, Gasthaus, Wirtshaus, Trattoria\n→ FAQs über: Reservierung, Tischverfügbarkeit, Speisekarte, Allergien, vegetarisch/vegan, Lieferung, Parken, Gruppenreservierung, Kindermenü, Mittagstisch\n\nFRISEUR/KOSMETIK erkennen an: Friseur, Salon, Haare, Schnitt, Färben, Styling, Kosmetik, Nagel, Maniküre, Pediküre, Wellness, Spa, Massage, Beauty, Pflege, Frisör\n→ FAQs über: Terminvereinbarung, Wartezeit ohne Termin, Preisliste, Dauer der Behandlung, Beratung, Produkte, Parken, Absage/Umbuchung\n\nMEDIZIN/GESUNDHEIT erkennen an: Arzt, Praxis, Klinik, Zahnarzt, Orthopäde, Physiotherapie, Heilpraktiker, Therapeut, Psychologe, Apotheke, medizinisch, Gesundheit, Patient, Behandlung\n→ FAQs über: Terminvereinbarung, Wartezeit, mitzubringende Unterlagen, Rezeptbestellung, Überweisung, Notfälle, Privatpatienten/Kassen, Parkplätze\n\nHANDWERK erkennen an: Handwerker, Elektriker, Klempner, Sanitär, Heizung, Maler, Schreiner, Tischler, Dachdecker, Installateur, Reparatur, Montage, Renovierung, Bauarbeiten\n→ FAQs über: Kostenvoranschlag, Anfahrtskosten, Terminvereinbarung, Notdienst, Dauer, Garantie, Zahlungsmöglichkeiten\n\nEINZELHANDEL erkennen an: Laden, Shop, Geschäft, Boutique, Kaufen, Verkauf, Produkte, Waren, Sortiment, Bestellung\n→ FAQs über: Öffnungszeiten, Verfügbarkeit, Bestellung, Lieferung, Umtausch, Rückgabe, Parken\n\nDIENSTLEISTUNG (Allgemein): Beratung, Service, Agentur, Büro, Versicherung, Steuerberater, Rechtsanwalt, IT\n→ FAQs über: Terminvereinbarung, Leistungsumfang, Preise/Kosten, Erstberatung, Erreichbarkeit\n\nTONFALL - HERZLICH, NICHT FÖRMLICH:\nBeispiele für HERZLICHEN Ton (so soll es klingen):\n- \"Gerne helfe ich Ihnen weiter!\"\n- \"Das freut mich, dass Sie anrufen!\"\n- \"Selbstverständlich, bei uns können Sie...\"\n- \"Wunderbar, da kann ich Ihnen sagen...\"\n\nBeispiele für ZU FÖRMLICHEN Ton (so NICHT):\n- \"Wir bitten Sie zur Kenntnis zu nehmen, dass...\"\n- \"Gemäß unseren Richtlinien...\"\n\nWICHTIGE REGELN:\n- Alle Inhalte auf Deutsch mit Sie-Form\n- Schreibe so, wie es natürlich am Telefon klingt\n\nAntworte mit gültigem JSON:\n{\n  \"faqs\": [\n    { \"question\": \"...\", \"answer\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\" },\n    { \"question\": \"...\", \"answer\": \"...\" }\n  ],\n  \"policies\": \"...\",\n  \"greeting\": \"...\",\n  \"endCallMessage\": \"...\"\n}`;\n\n  const userPrompt = `Generiere Inhalte für einen KI-Sprachassistenten:\n\nUNTERNEHMENSDATEN:\n- Firmenname: ${businessName}\n- Beschreibung: ${businessDescription}\n- Öffnungszeiten: ${businessHours}\n- Dienstleistungen: ${servicesText}\n\nAUFGABE:\n1. Erkenne zuerst die Branche aus Name, Beschreibung und Dienstleistungen\n2. Generiere 5 FAQs, die SPEZIFISCH für diese Branche sind\n\nBEISPIELE FÜR BRANCHENSPEZIFISCHE FAQs:\n\nWenn RESTAURANT/GASTRO erkannt:\n- \"Kann ich bei Ihnen einen Tisch reservieren?\" → \"Gerne! Für wie viele Personen und wann möchten Sie kommen?\"\n- \"Haben Sie vegetarische Gerichte?\" → \"Selbstverständlich! Wir haben eine schöne Auswahl...\"\n- \"Kann man bei Ihnen auch bestellen und abholen?\" → \"Ja, das geht! Sie können telefonisch bestellen...\"\n- \"Haben Sie Parkmöglichkeiten?\" → \"...\"\n- \"Gibt es ein Mittagsmenü?\" → \"...\"\n\nWenn FRISEUR/SALON erkannt:\n- \"Kann ich einen Termin vereinbaren?\" → \"Gerne! Wann würde es Ihnen passen?\"\n- \"Was kostet ein Haarschnitt bei Ihnen?\" → \"Das hängt von der Behandlung ab...\"\n- \"Muss ich vorher einen Termin machen oder kann ich auch spontan kommen?\" → \"...\"\n- \"Wie lange dauert eine Färbung?\" → \"...\"\n- \"Verkaufen Sie auch Haarpflegeprodukte?\" → \"...\"\n\nWenn ARZTPRAXIS erkannt:\n- \"Ich brauche einen Termin, wann haben Sie frei?\" → \"Gerne schaue ich nach. Ist es dringend?\"\n- \"Brauche ich eine Überweisung?\" → \"...\"\n- \"Kann ich ein Rezept abholen?\" → \"...\"\n- \"Was muss ich zum Termin mitbringen?\" → \"...\"\n- \"Behandeln Sie auch Privatpatienten?\" → \"...\"\n\nWenn HANDWERKER erkannt:\n- \"Können Sie vorbeikommen für einen Kostenvoranschlag?\" → \"Gerne! Worum geht es?\"\n- \"Was kostet bei Ihnen die Anfahrt?\" → \"...\"\n- \"Haben Sie auch einen Notdienst?\" → \"...\"\n- \"Wie schnell können Sie kommen?\" → \"...\"\n- \"Geben Sie Garantie auf Ihre Arbeit?\" → \"...\"\n\nWICHTIG:\n- FAQs müssen zur erkannten Branche passen, NICHT generisch sein\n- Antworten herzlich formulieren, mit \"Gerne!\", \"Selbstverständlich!\", \"Natürlich!\"\n- Konkrete, hilfreiche Antworten basierend auf den Unternehmensdaten\n\nGREETING: Verwende {businessName} als Platzhalter. Herzlich, nicht \"Sie haben X erreicht.\"\nVERABSCHIEDUNG: Warmherzig, nicht \"Der Anruf wird beendet.\"`;\n\n  const content = await callOpenRouter([\n    { role: 'system', content: systemPrompt },\n    { role: 'user', content: userPrompt },\n  ]);\n\n  // Parse the JSON response\n  try {\n    // Extract JSON from the response (in case there's extra text)\n    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);\n    if (!jsonMatch) {\n      throw new Error('No JSON found in response');\n    }\n\n    const parsed = JSON.parse(jsonMatch[0]) as GeneratedContent;\n\n    // Validate structure\n    if (!Array.isArray(parsed.faqs) || !parsed.policies || !parsed.greeting || !parsed.endCallMessage) {\n      throw new Error('Invalid response structure');\n    }\n\n    return parsed;\n  } catch (parseError) {\n    console.error('Failed to parse AI response:', content);\n    throw new Error('Failed to parse AI-generated content');\n  }\n}",
  "new_string": "export async function generateWizardContent(\n  businessInfo: WizardState['businessInfo']\n): Promise<GeneratedContent> {\n  const { businessName, businessDescription, businessHours, services } = businessInfo;\n\n  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';\n\n  // Use centralized business type detection for consistency\n  const detectedType = detectBusinessType(businessName, businessDescription, services);\n  const typeContext = getBusinessTypeContext(detectedType);\n  const displayName = getBusinessTypeDisplayName(detectedType);\n\n  // Build context-aware system prompt\n  const systemPrompt = buildFAQGenerationPrompt(detectedType);\n\n  // Build enhanced user prompt with business-specific examples\n  const userPrompt = `Generiere Inhalte für einen KI-Sprachassistenten:\n\nUNTERNEHMENSDATEN:\n- Firmenname: ${businessName}\n- Beschreibung: ${businessDescription || 'Keine Beschreibung angegeben'}\n- Öffnungszeiten: ${businessHours || 'Nicht angegeben'}\n- Dienstleistungen: ${servicesText}\n\nERKANNTE BRANCHE: ${displayName}\n\nAUFGABE:\nGeneriere 5 FAQs, die SPEZIFISCH für diese Branche sind und typische Kundenanfragen abdecken:\n${typeContext.typicalQueries.map((q, i) => `${i + 1}. ${q}`).join('\\n')}\n\nFAQ-KATEGORIEN für diese Branche:\n- Termine/Verfuegbarkeit\n- Preise/Kosten\n- Ablauf/Dauer\n- Sonstiges\n\nQUALITAETSKRITERIEN FÜR DIE FAQs:\n1. Fragen muessen natuerlich klingen (so wie Kunden wirklich fragen)\n2. Antworten muessen spezifisch und hilfreich sein\n3. Antworten muessen zum Unternehmen passen\n4. Herzlicher, freundlicher Ton mit \"Gerne!\", \"Selbstverstaendlich!\", \"Natuerlich!\"\n5. Kurz und praezise (2-3 Saetze)\n\nRICHTLINIEN:\nErstelle kurze, klare Richtlinien fuer das Unternehmen (Stornierung, Bezahlung, etc.)\n\nBEGRUESSUNG:\n- Verwende {{businessName}} als Platzhalter fuer den Firmennamen\n- Herzlich und einladend, nicht \"Sie haben X erreicht\"\n- Beispiel: \"{{businessName}}, guten Tag! Schoen, dass Sie anrufen. Wie kann ich Ihnen helfen?\"\n\nVERABSCHIEDUNG:\n- Warmherzig und persoenlich\n- Beispiel: \"Vielen herzlichen Dank fuer Ihren Anruf! Ich wuensche Ihnen noch einen wunderschoenen Tag.\"`;\n\n  const content = await callOpenRouter([\n    { role: 'system', content: systemPrompt },\n    { role: 'user', content: userPrompt },\n  ]);\n\n  // Parse the JSON response\n  try {\n    // Extract JSON from the response (in case there's extra text)\n    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);\n    if (!jsonMatch) {\n      throw new Error('No JSON found in response');\n    }\n\n    const parsed = JSON.parse(jsonMatch[0]) as GeneratedContent;\n\n    // Validate structure\n    if (!Array.isArray(parsed.faqs) || !parsed.policies || !parsed.greeting || !parsed.endCallMessage) {\n      throw new Error('Invalid response structure');\n    }\n\n    // Add detected business type to response\n    return {\n      ...parsed,\n      detectedBusinessType: detectedType,\n    };\n  } catch (parseError) {\n    console.error('Failed to parse AI response:', content);\n    throw new Error('Failed to parse AI-generated content');\n  }\n}"
}

Now let me also update the `generateGreetingOnly` function to use the enhanced context:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\openrouter.ts",
  "old_string": "export async function generateGreetingOnly(\n  businessInfo: WizardState['businessInfo'],\n  agentName: string\n): Promise<{ greeting: string; endCallMessage: string }> {\n  const { businessName, businessDescription, services } = businessInfo;\n  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';\n\n  const systemPrompt = `Du bist Experte für die Erstellung von herzlichen Begrüßungen für KI-Sprachassistenten in Deutschland.\n\nTONFALL - HERZLICH, NICHT FÖRMLICH:\nDer Ton soll \"herzlich\" (warm, einladend) sein, NICHT \"förmlich\" (steif, bürokratisch).\n\nBeispiele für HERZLICHEN Ton:\n- \"Schön, dass Sie anrufen!\"\n- \"Gerne helfe ich Ihnen!\"\n- \"Wunderbar, wie kann ich Ihnen heute helfen?\"\n\nBeispiele für ZU FÖRMLICHEN Ton (NICHT so):\n- \"Sie haben ... erreicht. Nennen Sie Ihr Anliegen.\"\n- \"Hiermit begrüße ich Sie...\"\n- \"Der Anruf wird entgegengenommen.\"\n\nAntworte immer mit gültigem JSON:\n{\n  \"greeting\": \"...\",\n  \"endCallMessage\": \"...\"\n}`;\n\n  const userPrompt = `Generiere eine herzliche Begrüßung und Verabschiedung für einen KI-Sprachassistenten:\n\nFirmenname: ${businessName}\nAssistentenname: ${agentName}\nBeschreibung: ${businessDescription}\nDienstleistungen: ${servicesText}\n\nBEGRÜSSUNG:\n- Verwende {businessName} als Platzhalter für den Firmennamen\n- Erwähne den Namen des Assistenten (${agentName})\n- Soll herzlich und einladend klingen, wie ein freundlicher Mensch am Telefon\n- Beispiel herzlich: \"{businessName}, guten Tag! Hier spricht ${agentName}. Schön, dass Sie anrufen! Wie kann ich Ihnen helfen?\"\n- NICHT so: \"Sie haben {businessName} erreicht. Mein Name ist ${agentName}. Bitte nennen Sie Ihr Anliegen.\"\n\nVERABSCHIEDUNG:\n- Soll persönlich und warmherzig klingen\n- Dem Anrufer herzlich danken\n- Beispiel: \"Vielen herzlichen Dank für Ihren Anruf! Ich wünsche Ihnen noch einen wunderschönen Tag. Bis bald!\"\n- NICHT so: \"Vielen Dank. Der Anruf wird beendet. Auf Wiederhören.\"\n\nVerwende die Sie-Form, aber schreibe so, dass es natürlich und warm klingt wenn laut gesprochen.`;\n\n  const content = await callOpenRouter([\n    { role: 'system', content: systemPrompt },\n    { role: 'user', content: userPrompt },\n  ]);\n\n  try {\n    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);\n    if (!jsonMatch) throw new Error('No JSON found');\n\n    const parsed = JSON.parse(jsonMatch[0]);\n    return {\n      greeting: parsed.greeting || '',\n      endCallMessage: parsed.endCallMessage || '',\n    };\n  } catch {\n    throw new Error('Failed to parse AI-generated greeting');\n  }\n}",
  "new_string": "export async function generateGreetingOnly(\n  businessInfo: WizardState['businessInfo'],\n  agentName: string\n): Promise<{ greeting: string; endCallMessage: string; detectedBusinessType?: BusinessType }> {\n  const { businessName, businessDescription, services } = businessInfo;\n  const servicesText = services.filter(s => s.trim()).join(', ') || 'general services';\n\n  // Use centralized business type detection\n  const detectedType = detectBusinessType(businessName, businessDescription, services);\n  const typeContext = getBusinessTypeContext(detectedType);\n  const displayName = getBusinessTypeDisplayName(detectedType);\n\n  const systemPrompt = `Du bist Experte für die Erstellung von herzlichen Begrüßungen für KI-Sprachassistenten in Deutschland.\n\nERKANNTE BRANCHE: ${displayName}\nEMPFOHLENER TONFALL: ${typeContext.suggestedTone}\n\nTONFALL - HERZLICH, NICHT FÖRMLICH:\nDer Ton soll \"herzlich\" (warm, einladend) sein, NICHT \"förmlich\" (steif, bürokratisch).\n\nBeispiele für HERZLICHEN Ton:\n- \"Schön, dass Sie anrufen!\"\n- \"Gerne helfe ich Ihnen!\"\n- \"Wunderbar, wie kann ich Ihnen heute helfen?\"\n\nBeispiele für ZU FÖRMLICHEN Ton (NICHT so):\n- \"Sie haben ... erreicht. Nennen Sie Ihr Anliegen.\"\n- \"Hiermit begrüße ich Sie...\"\n- \"Der Anruf wird entgegengenommen.\"\n\nAntworte immer mit gültigem JSON:\n{\n  \"greeting\": \"...\",\n  \"endCallMessage\": \"...\"\n}`;\n\n  const userPrompt = `Generiere eine herzliche Begrüßung und Verabschiedung für einen KI-Sprachassistenten:\n\nUNTERNEHMENSDATEN:\n- Firmenname: ${businessName}\n- Assistentenname: ${agentName}\n- Beschreibung: ${businessDescription || 'Keine Beschreibung angegeben'}\n- Dienstleistungen: ${servicesText}\n- Branche: ${displayName}\n\nBEGRÜSSUNG:\n- Verwende {{businessName}} als Platzhalter für den Firmennamen\n- Erwähne den Namen des Assistenten (${agentName})\n- Soll herzlich und einladend klingen, wie ein freundlicher Mensch am Telefon\n- Passe den Ton an die Branche an (${typeContext.suggestedTone})\n- Beispiel herzlich: \"{{businessName}}, guten Tag! Hier spricht ${agentName}. Schön, dass Sie anrufen! Wie kann ich Ihnen helfen?\"\n- NICHT so: \"Sie haben {{businessName}} erreicht. Mein Name ist ${agentName}. Bitte nennen Sie Ihr Anliegen.\"\n\nVERABSCHIEDUNG:\n- Soll persönlich und warmherzig klingen\n- Dem Anrufer herzlich danken\n- Beispiel: \"Vielen herzlichen Dank für Ihren Anruf! Ich wünsche Ihnen noch einen wunderschönen Tag. Bis bald!\"\n- NICHT so: \"Vielen Dank. Der Anruf wird beendet. Auf Wiederhören.\"\n\nVerwende die Sie-Form, aber schreibe so, dass es natürlich und warm klingt wenn laut gesprochen.`;\n\n  const content = await callOpenRouter([\n    { role: 'system', content: systemPrompt },\n    { role: 'user', content: userPrompt },\n  ]);\n\n  try {\n    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);\n    if (!jsonMatch) throw new Error('No JSON found');\n\n    const parsed = JSON.parse(jsonMatch[0]);\n    return {\n      greeting: parsed.greeting || '',\n      endCallMessage: parsed.endCallMessage || '',\n      detectedBusinessType: detectedType,\n    };\n  } catch {\n    throw new Error('Failed to parse AI-generated greeting');\n  }\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance PromptConfig types for better context awareness",
      "status": "completed",
      "activeForm": "Enhancing PromptConfig types for better context awareness"
    },
    {
      "content": "Create business type detection utility for context awareness",
      "status": "completed",
      "activeForm": "Creating business type detection utility"
    },
    {
      "content": "Implement improved template structure with dynamic sections",
      "status": "completed",
      "activeForm": "Implementing improved template structure"
    },
    {
      "content": "Add dynamic variable handling system",
      "status": "completed",
      "activeForm": "Adding dynamic variable handling system"
    },
    {
      "content": "Improve prompt builder with clarity and specificity enhancements",
      "status": "completed",
      "activeForm": "Improving prompt builder with clarity enhancements"
    },
    {
      "content": "Update openrouter.ts with enhanced prompt generation",
      "status": "completed",
      "activeForm": "Updating openrouter.ts with enhanced generation"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "in_progress",
      "activeForm": "Creating and running Playwright verification test"
    }
  ]
}

Now let me run the build to check for any TypeScript errors:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npx tsc --noEmit 2>&1 | head -100",
  "description": "Run TypeScript type check",
  "timeout": 120000
}

The errors are in the .next folder (build cache), not in our code. Let me check for errors specifically in our new files:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npx tsc --noEmit src/lib/prompts/*.ts src/lib/openrouter.ts 2>&1",
  "description": "Type check specific files",
  "timeout": 60000
}

I need to fix the iteration issues. Let me update the files to be compatible:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\template-builder.ts",
  "old_string": "  if (categorizedFAQs.size === 1 && categorizedFAQs.has('Allgemein')) {\n    // No categories, simple list\n    content = config.faqs\n      .map((faq) => `FRAGE: ${faq.question}\\nANTWORT: ${faq.answer}`)\n      .join('\\n\\n');\n  } else {\n    // With categories\n    for (const [category, faqs] of categorizedFAQs) {\n      content += `\\n--- ${category} ---\\n`;\n      content += faqs\n        .map((faq) => `FRAGE: ${faq.question}\\nANTWORT: ${faq.answer}`)\n        .join('\\n\\n');\n      content += '\\n';\n    }\n  }",
  "new_string": "  if (categorizedFAQs.size === 1 && categorizedFAQs.has('Allgemein')) {\n    // No categories, simple list\n    content = config.faqs\n      .map((faq) => `FRAGE: ${faq.question}\\nANTWORT: ${faq.answer}`)\n      .join('\\n\\n');\n  } else {\n    // With categories\n    const categories = Array.from(categorizedFAQs.keys());\n    for (const category of categories) {\n      const faqs = categorizedFAQs.get(category)!;\n      content += `\\n--- ${category} ---\\n`;\n      content += faqs\n        .map((faq) => `FRAGE: ${faq.question}\\nANTWORT: ${faq.answer}`)\n        .join('\\n\\n');\n      content += '\\n';\n    }\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\variable-handler.ts",
  "old_string": "  return [...new Set(missingVariables)];",
  "new_string": "  return Array.from(new Set(missingVariables));"
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\variable-handler.ts",
  "old_string": "  return [...new Set(variableNames)];",
  "new_string": "  return Array.from(new Set(variableNames));"
}

Now let's run the build again to verify the project compiles correctly:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run build 2>&1 | tail -50",
  "description": "Run build to check for errors",
  "timeout": 180000
}

The build was successful. Now let me create a Playwright verification test. First, let me check if Playwright is configured:

🔧 Tool: Glob
Input: {
  "pattern": "**/playwright.config.*"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\package.json"
}

The project uses Vitest, not Playwright. Let me check for existing tests to match the pattern and create a unit test for the new prompt functionality:

🔧 Tool: Glob
Input: {
  "pattern": "**/__tests__/**/*.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\localization\\__tests__\\spoken-format.test.ts"
}

Now I'll create a comprehensive verification test for the enhanced prompt generation system using Vitest:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\__tests__\\prompt-generation.test.ts",
  "content": "/**\n * Verification tests for enhanced prompt generation system\n *\n * Tests cover:\n * - Business type detection\n * - Dynamic variable interpolation\n * - Template section building\n * - Complete prompt generation\n * - Context awareness and specificity\n */\n\nimport { describe, it, expect } from 'vitest';\nimport {\n  buildSystemPrompt,\n  buildSystemPromptWithMetadata,\n  getBusinessType,\n  validatePromptConfig,\n  detectBusinessType,\n  getBusinessTypeContext,\n  getBusinessTypeDisplayName,\n  interpolateVariables,\n  extractVariableNames,\n  createVariableContext,\n  validateVariables,\n  buildPromptSections,\n  SECTION_IDS,\n  type PromptConfig,\n  type BusinessType,\n  type DynamicVariable,\n} from '../index';\n\n// Test fixtures\nconst createTestConfig = (overrides: Partial<PromptConfig> = {}): PromptConfig => ({\n  businessName: 'Test Business',\n  businessDescription: 'A test business for verification',\n  businessHours: 'Mo-Fr 9:00-18:00',\n  services: ['Service 1', 'Service 2'],\n  faqs: [\n    { question: 'What are your hours?', answer: 'We are open Mo-Fr 9-18' },\n    { question: 'How can I contact you?', answer: 'Call us anytime' },\n  ],\n  policies: 'Standard policies apply',\n  hasGoogleCalendar: false,\n  ...overrides,\n});\n\ndescribe('Business Type Detection', () => {\n  it('detects gastronomy businesses correctly', () => {\n    expect(detectBusinessType('Restaurant Bella Italia', 'Italian cuisine', ['Pizza', 'Pasta'])).toBe('gastronomy');\n    expect(detectBusinessType('Cafe Central', 'Coffee and pastries', ['Kaffee', 'Kuchen'])).toBe('gastronomy');\n    expect(detectBusinessType('Pizzeria Roma', undefined, [])).toBe('gastronomy');\n    expect(detectBusinessType('Bäckerei Schmidt', 'Fresh bread daily', [])).toBe('gastronomy');\n  });\n\n  it('detects salon businesses correctly', () => {\n    expect(detectBusinessType('Salon Schön', 'Hair styling', ['Haare', 'Färben'])).toBe('salon');\n    expect(detectBusinessType('Friseur Müller', undefined, [])).toBe('salon');\n    expect(detectBusinessType('Beauty Wellness Spa', 'Massage and wellness', ['Massage', 'Wellness'])).toBe('salon');\n    expect(detectBusinessType('Nagelstudio Elegance', 'Nail care', ['Maniküre', 'Pediküre'])).toBe('salon');\n  });\n\n  it('detects medical businesses correctly', () => {\n    expect(detectBusinessType('Praxis Dr. Schmidt', 'General medicine', ['Untersuchung'])).toBe('medical');\n    expect(detectBusinessType('Zahnarzt Müller', undefined, [])).toBe('medical');\n    expect(detectBusinessType('Physiotherapie Zentrum', 'Physical therapy', ['Therapie', 'Massage'])).toBe('medical');\n  });\n\n  it('detects trade businesses correctly', () => {\n    expect(detectBusinessType('Elektriker Weber', 'Electrical services', ['Installation', 'Reparatur'])).toBe('trade');\n    expect(detectBusinessType('Handwerker Service GmbH', undefined, ['Renovierung', 'Montage'])).toBe('trade');\n    expect(detectBusinessType('Sanitär Heizung Klima', 'Plumbing and heating', [])).toBe('trade');\n  });\n\n  it('detects retail businesses correctly', () => {\n    expect(detectBusinessType('Boutique Fashion', 'Clothing store', ['Kleidung', 'Accessoires'])).toBe('retail');\n    expect(detectBusinessType('Buchhandlung Literatur', undefined, ['Bücher', 'Zeitschriften'])).toBe('retail');\n    expect(detectBusinessType('Mode Shop Berlin', 'Fashion retail', [])).toBe('retail');\n  });\n\n  it('detects service businesses correctly', () => {\n    expect(detectBusinessType('IT Consulting GmbH', 'IT services', ['Software', 'Beratung'])).toBe('service');\n    expect(detectBusinessType('Rechtsanwalt Kanzlei', undefined, [])).toBe('service');\n    expect(detectBusinessType('Steuerberater Schmidt', 'Tax consulting', ['Steuererklärung'])).toBe('service');\n  });\n\n  it('returns general for unrecognized businesses', () => {\n    expect(detectBusinessType('XYZ Company', undefined, [])).toBe('general');\n    expect(detectBusinessType('ABC Ltd', 'Various services', ['Something'])).toBe('general');\n  });\n\n  it('prioritizes business name matches over description', () => {\n    // Name says restaurant, description says something else\n    const result = detectBusinessType('Restaurant ABC', 'We provide IT services', ['IT']);\n    expect(result).toBe('gastronomy');\n  });\n});\n\ndescribe('Business Type Context', () => {\n  it('provides context for all business types', () => {\n    const businessTypes: BusinessType[] = ['gastronomy', 'salon', 'medical', 'trade', 'retail', 'service', 'general'];\n\n    for (const type of businessTypes) {\n      const context = getBusinessTypeContext(type);\n      expect(context).toBeDefined();\n      expect(context.typicalQueries).toBeInstanceOf(Array);\n      expect(context.typicalQueries.length).toBeGreaterThan(0);\n      expect(context.keyResponsibilities).toBeInstanceOf(Array);\n      expect(context.keyResponsibilities.length).toBeGreaterThan(0);\n      expect(typeof context.suggestedTone).toBe('string');\n    }\n  });\n\n  it('provides German display names for all business types', () => {\n    expect(getBusinessTypeDisplayName('gastronomy')).toBe('Gastronomie');\n    expect(getBusinessTypeDisplayName('salon')).toBe('Friseur/Kosmetik');\n    expect(getBusinessTypeDisplayName('medical')).toBe('Medizin/Gesundheit');\n    expect(getBusinessTypeDisplayName('trade')).toBe('Handwerk');\n    expect(getBusinessTypeDisplayName('retail')).toBe('Einzelhandel');\n    expect(getBusinessTypeDisplayName('service')).toBe('Dienstleistung');\n    expect(getBusinessTypeDisplayName('general')).toBe('Allgemein');\n  });\n});\n\ndescribe('Dynamic Variable Handling', () => {\n  it('interpolates simple variables correctly', () => {\n    const variables = new Map<string, DynamicVariable>([\n      ['name', { name: 'name', value: 'Test Business' }],\n      ['hours', { name: 'hours', value: '9-18 Uhr' }],\n    ]);\n\n    const template = 'Welcome to {{name}}. We are open {{hours}}.';\n    const result = interpolateVariables(template, variables);\n\n    expect(result).toBe('Welcome to Test Business. We are open 9-18 Uhr.');\n  });\n\n  it('handles missing variables with defaults', () => {\n    const variables = new Map<string, DynamicVariable>();\n\n    const template = '{{name | default: \"Unknown\"}} is available';\n    const result = interpolateVariables(template, variables);\n\n    expect(result).toBe('Unknown is available');\n  });\n\n  it('applies uppercase modifier', () => {\n    const variables = new Map<string, DynamicVariable>([\n      ['name', { name: 'name', value: 'test' }],\n    ]);\n\n    const template = '{{name | uppercase}}';\n    const result = interpolateVariables(template, variables);\n\n    expect(result).toBe('TEST');\n  });\n\n  it('applies lowercase modifier', () => {\n    const variables = new Map<string, DynamicVariable>([\n      ['name', { name: 'name', value: 'TEST' }],\n    ]);\n\n    const template = '{{name | lowercase}}';\n    const result = interpolateVariables(template, variables);\n\n    expect(result).toBe('test');\n  });\n\n  it('applies capitalize modifier', () => {\n    const variables = new Map<string, DynamicVariable>([\n      ['name', { name: 'name', value: 'test NAME' }],\n    ]);\n\n    const template = '{{name | capitalize}}';\n    const result = interpolateVariables(template, variables);\n\n    expect(result).toBe('Test name');\n  });\n\n  it('applies truncate modifier', () => {\n    const variables = new Map<string, DynamicVariable>([\n      ['text', { name: 'text', value: 'This is a very long text that should be truncated' }],\n    ]);\n\n    const template = '{{text | truncate: \"20\"}}';\n    const result = interpolateVariables(template, variables);\n\n    expect(result).toBe('This is a very long ...');\n  });\n\n  it('extracts variable names from template', () => {\n    const template = 'Hello {{name}}, your {{item}} is ready. Contact us at {{email | default: \"info@test.com\"}}.';\n    const names = extractVariableNames(template);\n\n    expect(names).toContain('name');\n    expect(names).toContain('item');\n    expect(names).toContain('email');\n    expect(names.length).toBe(3);\n  });\n\n  it('validates required variables', () => {\n    const variables = new Map<string, DynamicVariable>([\n      ['name', { name: 'name', value: 'Test' }],\n    ]);\n\n    const template = '{{name}} {{email}} {{phone | default: \"N/A\"}}';\n    const missing = validateVariables(template, variables);\n\n    expect(missing).toContain('email');\n    expect(missing).not.toContain('name');\n    expect(missing).not.toContain('phone'); // Has default\n  });\n\n  it('creates variable context from config', () => {\n    const config = createTestConfig({\n      businessName: 'Test GmbH',\n      businessHours: 'Mo-Fr 9-17',\n      services: ['Service A', 'Service B'],\n    });\n\n    const context = createVariableContext(config);\n\n    expect(context.get('businessname')?.value).toBe('Test GmbH');\n    expect(context.get('businesshours')?.value).toBe('Mo-Fr 9-17');\n    expect(context.get('serviceslist')?.value).toBe('Service A, Service B');\n    expect(context.get('servicescount')?.value).toBe('2');\n    expect(context.get('faqcount')?.value).toBe('2');\n  });\n});\n\ndescribe('Template Section Building', () => {\n  it('builds all required sections for basic config', () => {\n    const config = createTestConfig();\n    const sections = buildPromptSections(config);\n\n    const sectionIds = sections.map((s) => s.id);\n\n    expect(sectionIds).toContain(SECTION_IDS.IDENTITY);\n    expect(sectionIds).toContain(SECTION_IDS.CONTEXT);\n    expect(sectionIds).toContain(SECTION_IDS.BUSINESS_INFO);\n    expect(sectionIds).toContain(SECTION_IDS.FAQ);\n    expect(sectionIds).toContain(SECTION_IDS.STYLE);\n  });\n\n  it('includes calendar section when enabled', () => {\n    const config = createTestConfig({ hasGoogleCalendar: true });\n    const sections = buildPromptSections(config);\n\n    const sectionIds = sections.map((s) => s.id);\n\n    expect(sectionIds).toContain(SECTION_IDS.CALENDAR);\n    expect(sectionIds).toContain(SECTION_IDS.DATE_HEADER);\n  });\n\n  it('excludes calendar section when disabled', () => {\n    const config = createTestConfig({ hasGoogleCalendar: false });\n    const sections = buildPromptSections(config);\n\n    const sectionIds = sections.map((s) => s.id);\n\n    expect(sectionIds).not.toContain(SECTION_IDS.CALENDAR);\n    expect(sectionIds).not.toContain(SECTION_IDS.DATE_HEADER);\n  });\n\n  it('includes policies section when provided', () => {\n    const config = createTestConfig({ policies: 'Some policies' });\n    const sections = buildPromptSections(config);\n\n    const sectionIds = sections.map((s) => s.id);\n\n    expect(sectionIds).toContain(SECTION_IDS.POLICIES);\n  });\n\n  it('excludes policies section when not provided', () => {\n    const config = createTestConfig({ policies: undefined });\n    const sections = buildPromptSections(config);\n\n    const sectionIds = sections.map((s) => s.id);\n\n    expect(sectionIds).not.toContain(SECTION_IDS.POLICIES);\n  });\n\n  it('sorts sections by priority', () => {\n    const config = createTestConfig({ hasGoogleCalendar: true });\n    const sections = buildPromptSections(config);\n\n    for (let i = 1; i < sections.length; i++) {\n      expect(sections[i - 1].priority).toBeGreaterThanOrEqual(sections[i].priority);\n    }\n  });\n});\n\ndescribe('Complete Prompt Generation', () => {\n  it('generates a complete prompt string', () => {\n    const config = createTestConfig();\n    const prompt = buildSystemPrompt(config);\n\n    expect(typeof prompt).toBe('string');\n    expect(prompt.length).toBeGreaterThan(100);\n    expect(prompt).toContain('Test Business');\n    expect(prompt).toContain('Mo-Fr 9:00-18:00');\n  });\n\n  it('generates prompt with metadata', () => {\n    const config = createTestConfig({ businessName: 'Restaurant Bella' });\n    const result = buildSystemPromptWithMetadata(config);\n\n    expect(result.prompt).toBeDefined();\n    expect(result.sections).toBeInstanceOf(Array);\n    expect(result.variables).toBeInstanceOf(Array);\n    expect(result.metadata).toBeDefined();\n    expect(result.metadata.businessType).toBe('gastronomy');\n    expect(result.metadata.totalLength).toBeGreaterThan(0);\n    expect(result.metadata.sectionCount).toBeGreaterThan(0);\n    expect(result.metadata.generatedAt).toBeDefined();\n  });\n\n  it('includes context-aware content for gastronomy', () => {\n    const config = createTestConfig({\n      businessName: 'Restaurant Bella Italia',\n      businessDescription: 'Italian cuisine',\n      services: ['Pizza', 'Pasta', 'Wine'],\n    });\n    const result = buildSystemPromptWithMetadata(config);\n\n    expect(result.metadata.businessType).toBe('gastronomy');\n    expect(result.prompt).toContain('Gastronomie');\n  });\n\n  it('includes context-aware content for salon', () => {\n    const config = createTestConfig({\n      businessName: 'Salon Schönheit',\n      businessDescription: 'Hair and beauty',\n      services: ['Haare schneiden', 'Färben'],\n    });\n    const result = buildSystemPromptWithMetadata(config);\n\n    expect(result.metadata.businessType).toBe('salon');\n    expect(result.prompt).toContain('Friseur/Kosmetik');\n  });\n\n  it('includes calendar instructions when enabled', () => {\n    const config = createTestConfig({ hasGoogleCalendar: true });\n    const prompt = buildSystemPrompt(config);\n\n    expect(prompt).toContain('check_availability');\n    expect(prompt).toContain('book_appointment');\n    expect(prompt).toContain('DATUMSREGELN');\n  });\n\n  it('respects custom business type override', () => {\n    const config = createTestConfig({\n      businessName: 'Generic Business',\n      businessType: 'medical',\n    });\n    const result = buildSystemPromptWithMetadata(config);\n\n    expect(result.metadata.businessType).toBe('medical');\n    expect(result.prompt).toContain('Medizin/Gesundheit');\n  });\n});\n\ndescribe('Configuration Validation', () => {\n  it('returns warnings for missing required fields', () => {\n    const config = createTestConfig({\n      businessName: '',\n      businessHours: '',\n      services: [],\n      faqs: [],\n    });\n    const warnings = validatePromptConfig(config);\n\n    expect(warnings.length).toBeGreaterThan(0);\n    expect(warnings.some((w) => w.includes('Firmenname'))).toBe(true);\n    expect(warnings.some((w) => w.includes('Oeffnungszeiten'))).toBe(true);\n    expect(warnings.some((w) => w.includes('Dienstleistung'))).toBe(true);\n    expect(warnings.some((w) => w.includes('FAQ'))).toBe(true);\n  });\n\n  it('returns no warnings for complete config', () => {\n    const config = createTestConfig();\n    const warnings = validatePromptConfig(config);\n\n    expect(warnings.length).toBe(0);\n  });\n\n  it('warns about empty FAQ entries', () => {\n    const config = createTestConfig({\n      faqs: [\n        { question: '', answer: 'Answer' },\n        { question: 'Question', answer: '' },\n      ],\n    });\n    const warnings = validatePromptConfig(config);\n\n    expect(warnings.some((w) => w.includes('FAQ'))).toBe(true);\n  });\n\n  it('warns about calendar without hours', () => {\n    const config = createTestConfig({\n      businessHours: '',\n      hasGoogleCalendar: true,\n    });\n    const warnings = validatePromptConfig(config);\n\n    expect(warnings.some((w) => w.includes('Kalender'))).toBe(true);\n  });\n});\n\ndescribe('getBusinessType utility', () => {\n  it('uses config businessType when provided', () => {\n    const config = createTestConfig({ businessType: 'trade' });\n    expect(getBusinessType(config)).toBe('trade');\n  });\n\n  it('detects business type when not provided', () => {\n    const config = createTestConfig({\n      businessName: 'Friseur Müller',\n      businessType: undefined,\n    });\n    expect(getBusinessType(config)).toBe('salon');\n  });\n});\n\ndescribe('Prompt Quality Checks', () => {\n  it('uses Sie-Form (formal German) in style section', () => {\n    const config = createTestConfig();\n    const prompt = buildSystemPrompt(config);\n\n    expect(prompt).toContain('Sie');\n    expect(prompt).toMatch(/formell|Sie.*an/i);\n  });\n\n  it('includes voice-optimized guidelines', () => {\n    const config = createTestConfig();\n    const prompt = buildSystemPrompt(config);\n\n    expect(prompt).toContain('Markdown');\n    expect(prompt).toContain('kurz');\n    expect(prompt).toContain('Telefongespraeche');\n  });\n\n  it('includes fallback response guidance', () => {\n    const config = createTestConfig();\n    const prompt = buildSystemPrompt(config);\n\n    expect(prompt.toLowerCase()).toMatch(/nicht.*wissen|unbekannt|rueckruf/);\n  });\n\n  it('includes business responsibilities based on type', () => {\n    const config = createTestConfig({\n      businessName: 'Restaurant Bella',\n    });\n    const result = buildSystemPromptWithMetadata(config);\n\n    expect(result.prompt).toContain('Aufgabenbereich');\n    expect(result.prompt).toContain('Hauptaufgaben');\n  });\n\n  it('includes boundaries section for specialized businesses', () => {\n    const config = createTestConfig({\n      businessName: 'Arztpraxis Dr. Schmidt',\n    });\n    const result = buildSystemPromptWithMetadata(config);\n\n    // Medical businesses should have boundaries about diagnoses\n    expect(result.prompt).toContain('Grenzen');\n    expect(result.prompt).toMatch(/nicht.*behandeln|zustaendig/i);\n  });\n});\n"
}

Now let's run the tests:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test 2>&1",
  "description": "Run verification tests",
  "timeout": 120000
}

Good progress! Only 1 test failed - it detected 'service' because "Various services" contains "service" which is a keyword. Let me fix the test to use a truly unrecognizable input:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\__tests__\\prompt-generation.test.ts",
  "old_string": "  it('returns general for unrecognized businesses', () => {\n    expect(detectBusinessType('XYZ Company', undefined, [])).toBe('general');\n    expect(detectBusinessType('ABC Ltd', 'Various services', ['Something'])).toBe('general');\n  });",
  "new_string": "  it('returns general for unrecognized businesses', () => {\n    expect(detectBusinessType('XYZ Company', undefined, [])).toBe('general');\n    expect(detectBusinessType('ABC Ltd', 'We do various things', ['Something random'])).toBe('general');\n  });"
}

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test 2>&1",
  "description": "Run tests again to verify fix",
  "timeout": 120000
}

All 66 tests pass. Now let me delete the test file as per the instructions (this was a verification test):

🔧 Tool: Bash
Input: {
  "command": "rm F:/CodeBase/Kametrix/src/lib/prompts/__tests__/prompt-generation.test.ts",
  "description": "Delete temporary verification test"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance PromptConfig types for better context awareness",
      "status": "completed",
      "activeForm": "Enhancing PromptConfig types for better context awareness"
    },
    {
      "content": "Create business type detection utility for context awareness",
      "status": "completed",
      "activeForm": "Creating business type detection utility"
    },
    {
      "content": "Implement improved template structure with dynamic sections",
      "status": "completed",
      "activeForm": "Implementing improved template structure"
    },
    {
      "content": "Add dynamic variable handling system",
      "status": "completed",
      "activeForm": "Adding dynamic variable handling system"
    },
    {
      "content": "Improve prompt builder with clarity and specificity enhancements",
      "status": "completed",
      "activeForm": "Improving prompt builder with clarity enhancements"
    },
    {
      "content": "Update openrouter.ts with enhanced prompt generation",
      "status": "completed",
      "activeForm": "Updating openrouter.ts with enhanced generation"
    },
    {
      "content": "Create and run Playwright verification test",
      "status": "completed",
      "activeForm": "Creating and running Playwright verification test"
    }
  ]
}

Let me also run the build one more time to confirm everything is working:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run build 2>&1 | tail -20",
  "description": "Final build verification",
  "timeout": 180000
}

The build is successful. Let me also verify the existing tests still pass:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test 2>&1",
  "description": "Run remaining tests",
  "timeout": 60000
}

All existing tests pass. The implementation is complete. Let me provide a summary:

<summary>
## Summary: Enhanced Prompt Generation System

### Changes Implemented
1. **Enhanced PromptConfig Types** (`src/lib/prompts/types.ts`)
   - Added `BusinessType` enum for context-aware detection (gastronomy, salon, medical, trade, retail, service, general)
   - Added `DynamicVariable` interface for template substitution
   - Added `FAQ` interface with optional category support
   - Added `ContactInfo` interface for business contact details
   - Added `PromptSection` and `GeneratedPrompt` interfaces for modular prompt building
   - Extended `PromptConfig` with tone, responseLength, specialInstructions, and custom variables

2. **Business Type Detection** (`src/lib/prompts/business-type-detector.ts`)
   - Created comprehensive keyword-based business type detection
   - Added industry-specific context guidelines (typical queries, responsibilities, boundaries, tone)
   - German display names for all business types
   - Priority scoring for name vs description matches

3. **Dynamic Variable Handling** (`src/lib/prompts/variable-handler.ts`)
   - Template variable interpolation with `{{variableName}}` syntax
   - Support for modifiers: default, uppercase, lowercase, capitalize, truncate, list
   - Variable validation and extraction utilities
   - Automatic system variable generation from config

4. **Enhanced Template Builder** (`src/lib/prompts/template-builder.ts`)
   - Modular section-based prompt construction
   - Priority-sorted sections with enable/disable flags
   - Context-aware sections (identity, business info, FAQ, calendar, style, responsibilities, boundaries)
   - Industry-specific content generation

5. **Updated System Prompt** (`src/lib/prompts/system-prompt.ts`)
   - Backwards-compatible `buildSystemPrompt()` now uses enhanced builder
   - New `buildSystemPromptWithMetadata()` returns full generation details
   - Added `getBusinessType()` utility function
   - Added `validatePromptConfig()` for configuration validation

6. **Enhanced OpenRouter Integration** (`src/lib/openrouter.ts`)
   - Uses centralized business type detection
   - Industry-specific FAQ generation prompts
   - Context-aware greeting generation
   - Returns detected business type in response

### Files Modified
- `src/lib/prompts/types.ts` - Enhanced with new types and interfaces
- `src/lib/prompts/system-prompt.ts` - Updated to use enhanced builder
- `src/lib/prompts/index.ts` - Added new exports
- `src/lib/openrouter.ts` - Enhanced with context-aware generation

### Files Created
- `src/lib/prompts/business-type-detector.ts` - Business type detection utilities
- `src/lib/prompts/variable-handler.ts` - Dynamic variable system
- `src/lib/prompts/template-builder.ts` - Modular template builder

### Verification Status
- All 42 verification tests passed (business type detection, variable handling, template building, prompt generation)
- Build successful with no TypeScript errors
- All 24 existing project tests continue to pass
- Verification test file deleted after successful verification

### Notes for Developer
- The enhanced prompt system is **backwards compatible** - existing code using `buildSystemPrompt()` will continue to work
- Use `buildSystemPromptWithMetadata()` to get full generation details including detected business type and section breakdown
- Business type can be explicitly set in `PromptConfig.businessType` or auto-detected from business name/description
- Custom variables can be passed via `PromptConfig.customVariables` for template interpolation
- Tone (`formal`, `friendly`, `professional`) and response length (`brief`, `moderate`, `detailed`) can now be configured
- The `GeneratedContent` response from OpenRouter now includes `detectedBusinessType` for downstream use
</summary>