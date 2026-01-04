
🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "Explore this codebase to understand its structure. I need to implement a feature to improve how the AI voice agent processes and executes Google Calendar operations through natural language. \n\nPlease find:\n1. The overall project structure (what kind of project is this - frontend, backend, full-stack?)\n2. Any existing calendar-related code or integrations\n3. Any AI/voice agent related code\n4. Intent recognition or NLP processing code\n5. How the application handles natural language processing\n\nBe thorough and report back with file paths and descriptions of what you find.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find . -type f -name \"package.json\" -o -name \"tsconfig.json\" -o -name \"README.md\" | head -20",
  "description": "Find project configuration files to understand project type"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.json",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\package.json"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la F:\\CodeBase\\Kametrix | head -50",
  "description": "List root directory contents"
}

🔧 Tool: Bash
Input: {
  "command": "find F:\\CodeBase\\Kametrix -maxdepth 2 -type d -not -path \"*/node_modules/*\" | sort",
  "description": "Find main directories excluding node_modules"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\" | head -60",
  "description": "List root directory contents"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\" -maxdepth 2 -type d -not -path \"*/node_modules/*\" -not -path \"*/.next/*\" -not -path \"*/.git/*\" | sort",
  "description": "Find main directories excluding node_modules, .next, .git"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\" -type f -name \"*.ts\" -o -name \"*.tsx\" | head -50",
  "description": "List TypeScript files in src directory"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\src\"",
  "description": "List src directory contents"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/**/*.{ts,tsx}",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Grep
Input: {
  "pattern": "calendar|Calendar",
  "path": "F:\\CodeBase\\Kametrix\\src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Grep
Input: {
  "pattern": "vapi|voice|agent",
  "path": "F:\\CodeBase\\Kametrix\\src",
  "output_mode": "files_with_matches",
  "head_limit": 30
}

🔧 Tool: Grep
Input: {
  "pattern": "intent|nlp|natural|language|processing|extract",
  "path": "F:\\CodeBase\\Kametrix\\src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\calendar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\vapi\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\system-prompt.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\tool-definitions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\variable-handler.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\vapi\\assistants.ts",
  "limit": 80
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "offset": 100,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\template-builder.ts",
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\\app\\api\\google\\calendar\" -type f -name \"*.ts\"",
  "description": "Find calendar API route files"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\google\\calendar\\book\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "offset": 300,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\business-type-detector.ts",
  "limit": 80
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "offset": 500,
  "limit": 200
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\\lib\\prompts\" -type f -name \"*.ts\"",
  "description": "Find all prompt-related files"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\prisma\"",
  "description": "List prisma directory contents"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "offset": 700,
  "limit": 150
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\types.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\vapi\\client.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\vapi\\types.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\\lib\" -maxdepth 1 -name \"*.ts\" -type f",
  "description": "List main utility files in lib directory"
}

Excellent! Now I have a comprehensive understanding of the codebase. This is a Vapi-powered voice AI agent platform (Kametrix) with Google Calendar integration. Let me now plan the implementation to improve how the AI voice agent processes and executes Google Calendar operations.

Based on the exploration, I need to enhance:
1. **Intent recognition** for calendar requests in the tool definitions and system prompts
2. **Parameter extraction** (dates, times, attendees) in the webhook handler
3. **Conflict detection** when booking appointments
4. **Conversational responses** for calendar actions

Let me examine the key files more closely to understand what enhancements are needed:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\tool-definitions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\calendar.ts"
}

Now let me also check the system prompt builder to understand how the AI is instructed:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\template-builder.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\system-prompt.ts"
}

Now I have a comprehensive understanding of the codebase. Let me create a todo list to track the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "pending",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "pending",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "pending",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "pending",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "pending",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "pending",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "pending",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "in_progress",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "pending",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "pending",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "pending",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "pending",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "pending",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "pending",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

Let me start implementing the enhancements. First, I'll enhance the tool definitions with better intent recognition and parameter descriptions:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\tool-definitions.ts",
  "old_string": "/**\n * Calendar tool definitions for Vapi assistants\n *\n * These tools are registered with Vapi and allow the AI to interact with Google Calendar.\n * All descriptions are in German for consistency with the German system prompts.\n */\n\n/**\n * Names of available calendar tools\n */\nexport const CALENDAR_TOOL_NAMES = [\n  'check_availability',\n  'book_appointment',\n  'reschedule_appointment',\n  'cancel_appointment',\n  'list_appointments',\n  'search_appointments',\n  'find_next_available',\n] as const;",
  "new_string": "/**\n * Calendar tool definitions for Vapi assistants\n *\n * These tools are registered with Vapi and allow the AI to interact with Google Calendar.\n * All descriptions are in German for consistency with the German system prompts.\n *\n * Enhanced with:\n * - Improved intent recognition through detailed descriptions\n * - Better parameter extraction hints for dates, times, attendees\n * - Conflict detection support\n * - Natural language pattern recognition\n */\n\n/**\n * Names of available calendar tools\n */\nexport const CALENDAR_TOOL_NAMES = [\n  'check_availability',\n  'book_appointment',\n  'reschedule_appointment',\n  'cancel_appointment',\n  'list_appointments',\n  'search_appointments',\n  'find_next_available',\n  'check_conflicts',\n] as const;\n\n/**\n * Common intent patterns that map to calendar tools (for AI guidance)\n * These help the AI recognize various ways users express calendar intentions\n */\nexport const CALENDAR_INTENT_PATTERNS = {\n  check_availability: [\n    'wann haben Sie Zeit',\n    'wann ist frei',\n    'welche Termine sind verfügbar',\n    'haben Sie morgen Zeit',\n    'freie Termine',\n    'Verfügbarkeit prüfen',\n    'wann geht es',\n    'wann passt es',\n  ],\n  book_appointment: [\n    'Termin buchen',\n    'Termin vereinbaren',\n    'Termin machen',\n    'ich möchte einen Termin',\n    'Termin reservieren',\n    'Termin eintragen',\n    'buchen Sie mir',\n    'ich brauche einen Termin',\n  ],\n  reschedule_appointment: [\n    'Termin verschieben',\n    'Termin ändern',\n    'Termin verlegen',\n    'anderen Termin',\n    'umbuchen',\n    'neuen Termin statt',\n    'Termin auf',\n  ],\n  cancel_appointment: [\n    'Termin absagen',\n    'Termin stornieren',\n    'Termin löschen',\n    'Termin abbrechen',\n    'nicht mehr kommen',\n    'Termin platzen lassen',\n  ],\n  list_appointments: [\n    'meine Termine',\n    'welche Termine habe ich',\n    'Terminübersicht',\n    'alle Termine',\n    'Termine anzeigen',\n    'was steht an',\n  ],\n  search_appointments: [\n    'Termin suchen',\n    'Termin finden',\n    'wann war mein Termin',\n    'Termin von',\n    'Termin mit',\n  ],\n  find_next_available: [\n    'nächster freier Termin',\n    'wann geht es als nächstes',\n    'frühester Termin',\n    'baldmöglichst',\n    'schnellstmöglich',\n    'so früh wie möglich',\n  ],\n} as const;"
}

Now let me enhance the tool definitions with better descriptions and add the new conflict detection tool:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\tool-definitions.ts",
  "old_string": "  return [\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'check_availability',\n        description: 'Prueft die Kalenderverfuegbarkeit fuer ein Datum.',\n        parameters: {\n          type: 'object',\n          properties: {\n            date: {\n              type: 'string',\n              description:\n                'Datum als Text. BEVORZUGT relative Begriffe: \"morgen\", \"heute\", \"uebermorgen\", \"Montag\", \"Dienstag\", etc. ODER Format JJJJ-MM-TT.',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['date'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'book_appointment',\n        description: 'Bucht einen Termin im Kalender. Unterstuetzt auch wiederkehrende Termine.',\n        parameters: {\n          type: 'object',\n          properties: {\n            date: {\n              type: 'string',\n              description:\n                'Datum als Text. BEVORZUGT relative Begriffe: \"morgen\", \"heute\", \"uebermorgen\", \"Montag\", \"Dienstag\", etc. ODER Format JJJJ-MM-TT.',\n            },\n            time: {\n              type: 'string',\n              description: 'Uhrzeit im Format HH:MM (24-Stunden-Format, z.B. 14:30)',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Vollstaendiger Name des Anrufers (erforderlich)',\n            },\n            callerPhone: {\n              type: 'string',\n              description: 'Telefonnummer des Anrufers (optional)',\n            },\n            callerEmail: {\n              type: 'string',\n              description: 'E-Mail-Adresse des Anrufers (optional)',\n            },\n            summary: {\n              type: 'string',\n              description: 'Kurze Beschreibung des Termins (optional)',\n            },\n            recurrence: {\n              type: 'string',\n              description: 'Wiederholung: \"taeglich\", \"woechentlich\", \"monatlich\", \"jeden Montag\", \"alle 2 Wochen\", etc. (optional)',\n            },\n            location: {\n              type: 'string',\n              description: 'Ort des Termins (optional)',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['date', 'time', 'callerName'] as const,\n        },\n      },\n    },",
  "new_string": "  return [\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'check_availability',\n        description: 'Prueft die Kalenderverfuegbarkeit fuer ein bestimmtes Datum. Nutze diese Funktion wenn der Anrufer wissen moechte, wann Zeit ist, welche Termine frei sind, oder nach Verfuegbarkeit fragt. Typische Anfragen: \"Wann haben Sie Zeit?\", \"Haben Sie morgen frei?\", \"Welche Zeiten gehen am Montag?\"',\n        parameters: {\n          type: 'object',\n          properties: {\n            date: {\n              type: 'string',\n              description:\n                'Datum fuer die Verfuegbarkeitspruefung. BEVORZUGT relative Begriffe verwenden: \"morgen\", \"heute\", \"uebermorgen\", \"naechsten Montag\", \"Dienstag\", \"in 3 Tagen\", \"naechste Woche\". Alternativ ISO-Format JJJJ-MM-TT. Beispiele: \"morgen\" fuer den naechsten Tag, \"Freitag\" fuer den kommenden Freitag.',\n            },\n            preferredTimeRange: {\n              type: 'string',\n              description: 'Bevorzugte Tageszeit des Anrufers (optional). Moegliche Werte: \"morgens\" (09:00-12:00), \"mittags\" (12:00-14:00), \"nachmittags\" (14:00-17:00), \"vormittags\" (09:00-12:00). Hilft bei der Filterung der verfuegbaren Zeiten.',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['date'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'check_conflicts',\n        description: 'Prueft ob ein gewuenschter Termin mit bestehenden Terminen kollidiert. Nutze diese Funktion VOR dem Buchen wenn du sicherstellen moechtest, dass der gewaehlte Zeitraum wirklich frei ist. Gibt Konflikte zurueck falls vorhanden und schlaegt Alternativen vor.',\n        parameters: {\n          type: 'object',\n          properties: {\n            date: {\n              type: 'string',\n              description:\n                'Datum zu pruefen. Relative Begriffe: \"morgen\", \"heute\", \"Montag\", etc. ODER Format JJJJ-MM-TT.',\n            },\n            time: {\n              type: 'string',\n              description: 'Uhrzeit im Format HH:MM (24-Stunden-Format, z.B. 14:30)',\n            },\n            durationMinutes: {\n              type: 'number',\n              description: 'Dauer des gewuenschten Termins in Minuten (optional, Standard: konfigurierte Termindauer)',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['date', 'time'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'book_appointment',\n        description: 'Bucht einen Termin im Kalender. Unterstuetzt auch wiederkehrende Termine und mehrere Teilnehmer. Nutze diese Funktion wenn der Anrufer einen Termin vereinbaren, buchen, reservieren oder eintragen moechte. WICHTIG: Vor dem Buchen immer check_availability oder check_conflicts nutzen um sicherzustellen, dass der Zeitraum frei ist.',\n        parameters: {\n          type: 'object',\n          properties: {\n            date: {\n              type: 'string',\n              description:\n                'Termindatum. BEVORZUGT relative Begriffe: \"morgen\", \"heute\", \"uebermorgen\", \"naechsten Montag\". Alternativ JJJJ-MM-TT. Extrahiere das Datum aus Aussagen wie \"Ich haette gerne am Freitag einen Termin\" -> \"Freitag\".',\n            },\n            time: {\n              type: 'string',\n              description: 'Terminuhrzeit im Format HH:MM (24-Stunden). Extrahiere aus: \"um 14 Uhr\" -> \"14:00\", \"halb drei\" -> \"14:30\", \"Viertel nach zehn\" -> \"10:15\", \"10 Uhr morgens\" -> \"10:00\".',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Vollstaendiger Name des Anrufers. ERFORDERLICH. Bei \"Mein Name ist Max Mueller\" -> \"Max Mueller\". Frage explizit nach falls nicht genannt.',\n            },\n            callerPhone: {\n              type: 'string',\n              description: 'Telefonnummer des Anrufers (optional aber empfohlen). Format flexibel: \"0171 1234567\" oder \"+49 171 1234567\".',\n            },\n            callerEmail: {\n              type: 'string',\n              description: 'E-Mail-Adresse des Anrufers (optional). Bei gueltiger E-Mail wird eine Kalendereinladung gesendet.',\n            },\n            summary: {\n              type: 'string',\n              description: 'Betreff/Grund des Termins. Z.B. \"Beratungsgespraech\", \"Ersttermin\", \"Nachkontrolle\". Falls nicht explizit genannt, aus dem Kontext ableiten.',\n            },\n            attendees: {\n              type: 'string',\n              description: 'Weitere Teilnehmer als kommagetrennte E-Mail-Adressen (optional). Z.B. \"partner@email.de, kollege@firma.de\".',\n            },\n            recurrence: {\n              type: 'string',\n              description: 'Wiederholungsmuster (optional). Moeglichkeiten: \"taeglich\", \"woechentlich\", \"monatlich\", \"jeden Montag\", \"alle 2 Wochen\", \"werktags\". Nur setzen wenn Kunde explizit nach wiederkehrendem Termin fragt.',\n            },\n            location: {\n              type: 'string',\n              description: 'Ort des Termins (optional). Adresse oder Raumbeschreibung.',\n            },\n            notes: {\n              type: 'string',\n              description: 'Zusaetzliche Notizen oder Anmerkungen des Anrufers (optional). Besondere Wuensche, Vorbereitungen, etc.',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['date', 'time', 'callerName'] as const,\n        },\n      },\n    },"
}

Now let me update the remaining tool definitions with better descriptions:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\tool-definitions.ts",
  "old_string": "    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'reschedule_appointment',\n        description: 'Verschiebt einen bestehenden Termin auf ein neues Datum/Uhrzeit.',\n        parameters: {\n          type: 'object',\n          properties: {\n            eventId: {\n              type: 'string',\n              description: 'Die ID des zu verschiebenden Termins',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Name des Anrufers um den Termin zu finden',\n            },\n            newDate: {\n              type: 'string',\n              description: 'Neues Datum. BEVORZUGT relative Begriffe: \"morgen\", \"heute\", \"uebermorgen\", \"Montag\", etc. ODER Format JJJJ-MM-TT.',\n            },\n            newTime: {\n              type: 'string',\n              description: 'Neue Uhrzeit im Format HH:MM (24-Stunden-Format, z.B. 14:30)',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['newDate', 'newTime'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'cancel_appointment',\n        description: 'Storniert/loescht einen bestehenden Termin.',\n        parameters: {\n          type: 'object',\n          properties: {\n            eventId: {\n              type: 'string',\n              description: 'Die ID des zu stornierenden Termins',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Name des Anrufers um den Termin zu finden',\n            },\n            date: {\n              type: 'string',\n              description: 'Datum des Termins (fuer wiederkehrende Termine: nur diese Instanz). Format JJJJ-MM-TT.',\n            },\n            cancelAll: {\n              type: 'string',\n              description: 'Bei wiederkehrenden Terminen: \"ja\" um alle kuenftigen Termine zu stornieren, \"nein\" nur diese Instanz.',\n            },\n          },\n          required: [] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'list_appointments',\n        description: 'Listet alle Termine in einem Zeitraum auf.',\n        parameters: {\n          type: 'object',\n          properties: {\n            startDate: {\n              type: 'string',\n              description: 'Startdatum. BEVORZUGT relative Begriffe: \"heute\", \"morgen\", etc. ODER Format JJJJ-MM-TT.',\n            },\n            endDate: {\n              type: 'string',\n              description: 'Enddatum. BEVORZUGT relative Begriffe oder Format JJJJ-MM-TT.',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['startDate'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'search_appointments',\n        description: 'Sucht nach Terminen anhand von Name, Beschreibung oder anderen Kriterien.',\n        parameters: {\n          type: 'object',\n          properties: {\n            query: {\n              type: 'string',\n              description: 'Suchbegriff (Name, Betreff, Ort, etc.)',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Name des Anrufers um dessen Termine zu finden',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['query'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'find_next_available',\n        description: 'Findet den naechsten verfuegbaren Termin.',\n        parameters: {\n          type: 'object',\n          properties: {\n            afterDate: {\n              type: 'string',\n              description: 'Suche nach diesem Datum. Standard: jetzt.',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: [] as const,\n        },\n      },\n    },\n  ];",
  "new_string": "    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'reschedule_appointment',\n        description: 'Verschiebt einen bestehenden Termin auf ein neues Datum/Uhrzeit. Nutze diese Funktion wenn der Anrufer einen Termin verlegen, verschieben, aendern oder umbuchen moechte. Der Termin wird anhand des Anrufernamens automatisch gefunden.',\n        parameters: {\n          type: 'object',\n          properties: {\n            eventId: {\n              type: 'string',\n              description: 'Die ID des zu verschiebenden Termins (optional - wird automatisch per callerName gesucht falls nicht angegeben)',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Name des Anrufers um den Termin automatisch zu finden. EMPFOHLEN statt eventId.',\n            },\n            originalDate: {\n              type: 'string',\n              description: 'Urspruengliches Datum des Termins (optional, hilft bei der Identifikation wenn mehrere Termine existieren). Format: relative Begriffe oder JJJJ-MM-TT.',\n            },\n            newDate: {\n              type: 'string',\n              description: 'Neues gewuenschtes Datum. BEVORZUGT relative Begriffe: \"morgen\", \"heute\", \"uebermorgen\", \"naechsten Montag\", \"Freitag\". Alternativ JJJJ-MM-TT.',\n            },\n            newTime: {\n              type: 'string',\n              description: 'Neue gewuenschte Uhrzeit im Format HH:MM (24-Stunden-Format). Extrahiere aus Aussagen wie \"auf 15 Uhr\" -> \"15:00\".',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['newDate', 'newTime'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'cancel_appointment',\n        description: 'Storniert/loescht einen bestehenden Termin. Nutze diese Funktion wenn der Anrufer einen Termin absagen, stornieren, loeschen oder abbrechen moechte. Bei wiederkehrenden Terminen kann einzeln oder alle storniert werden.',\n        parameters: {\n          type: 'object',\n          properties: {\n            eventId: {\n              type: 'string',\n              description: 'Die ID des zu stornierenden Termins (optional - wird automatisch per callerName gesucht)',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Name des Anrufers um den Termin automatisch zu finden. EMPFOHLEN.',\n            },\n            date: {\n              type: 'string',\n              description: 'Datum des zu stornierenden Termins. Bei wiederkehrenden Terminen: Datum der spezifischen Instanz. Format: relative Begriffe oder JJJJ-MM-TT.',\n            },\n            reason: {\n              type: 'string',\n              description: 'Grund fuer die Stornierung (optional). Wird in der Benachrichtigung erwaehnt.',\n            },\n            cancelAll: {\n              type: 'string',\n              description: 'Bei wiederkehrenden Terminen: \"ja\" um alle kuenftigen Termine zu stornieren, \"nein\" nur diese Instanz. Frage nach wenn unklar.',\n            },\n          },\n          required: [] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'list_appointments',\n        description: 'Listet alle Termine in einem Zeitraum auf. Nutze diese Funktion wenn der Anrufer wissen moechte welche Termine anstehen, eine Terminuebersicht benoetigt, oder nach allen Terminen fragt. Zeigt Datum, Uhrzeit und Beschreibung.',\n        parameters: {\n          type: 'object',\n          properties: {\n            startDate: {\n              type: 'string',\n              description: 'Startdatum der Abfrage. BEVORZUGT relative Begriffe: \"heute\", \"morgen\", \"diese Woche\", \"naechste Woche\". Alternativ JJJJ-MM-TT.',\n            },\n            endDate: {\n              type: 'string',\n              description: 'Enddatum der Abfrage (optional). Bei \"heute\" als startDate wird nur der Tag abgefragt. Bei \"diese Woche\" wird automatisch bis Sonntag gesucht.',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Name des Anrufers um nur dessen Termine zu filtern (optional).',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['startDate'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'search_appointments',\n        description: 'Sucht nach Terminen anhand von Name, Beschreibung, Ort oder anderen Kriterien. Nutze diese Funktion wenn der Anrufer einen bestimmten Termin sucht oder nach Terminen mit einer bestimmten Person/Beschreibung fragt.',\n        parameters: {\n          type: 'object',\n          properties: {\n            query: {\n              type: 'string',\n              description: 'Suchbegriff - kann Name, Betreff, Ort oder Beschreibung sein. Z.B. \"Mueller\", \"Beratung\", \"Zahnarzt\".',\n            },\n            callerName: {\n              type: 'string',\n              description: 'Name des Anrufers um dessen Termine gezielt zu finden. Besonders nuetzlich wenn der Anrufer \"meinen Termin\" sucht.',\n            },\n            dateRange: {\n              type: 'string',\n              description: 'Zeitraum fuer die Suche (optional). Z.B. \"diese Woche\", \"naechsten Monat\", \"Januar\". Standard: 30 Tage zurueck bis 90 Tage voraus.',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: ['query'] as const,\n        },\n      },\n    },\n    {\n      type: 'function',\n      async: false,\n      server: { url: webhookUrl },\n      function: {\n        name: 'find_next_available',\n        description: 'Findet den naechsten verfuegbaren Termin. Nutze diese Funktion wenn der Anrufer nach dem naechsten freien Termin, dem fruehesten moeglichen Termin, oder einem Termin \"so bald wie moeglich\" fragt. Durchsucht die naechsten 14 Tage.',\n        parameters: {\n          type: 'object',\n          properties: {\n            afterDate: {\n              type: 'string',\n              description: 'Suche ab diesem Datum (optional). Standard: ab jetzt. Nuetzlich wenn Anrufer sagt \"ab naechster Woche\" oder \"ab Montag\".',\n            },\n            preferredTimeRange: {\n              type: 'string',\n              description: 'Bevorzugte Tageszeit (optional). Moegliche Werte: \"morgens\", \"vormittags\", \"mittags\", \"nachmittags\". Hilft bei der Suche nach passenden Zeiten.',\n            },\n            minDuration: {\n              type: 'number',\n              description: 'Mindestdauer des Termins in Minuten (optional). Standard: konfigurierte Termindauer.',\n            },\n            timeZone: {\n              type: 'string',\n              description: 'IANA-Zeitzone. Standard: Europe/Berlin.',\n            },\n          },\n          required: [] as const,\n        },\n      },\n    },\n  ];"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "completed",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "in_progress",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "pending",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "pending",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "pending",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "pending",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "pending",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

Now let me enhance the calendar library with improved time parsing and conflict detection:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\calendar.ts",
  "old_string": "// ============================================================================\n// DATE PARSING FUNCTIONS\n// ============================================================================\n\n/**\n * Parse a date input that can be either a relative term (morgen, heute, übermorgen)\n * or an ISO date string. Returns the resolved date in YYYY-MM-DD format.\n *\n * This handles the common case where the AI passes relative terms instead of\n * calculating dates (which it often gets wrong).\n *\n * @param dateInput - Either a relative term or YYYY-MM-DD date string\n * @returns Resolved date in YYYY-MM-DD format\n */\nexport function parseDateInput(dateInput: string): string {\n  const input = dateInput.toLowerCase().trim();\n  const now = new Date();\n\n  // German relative date terms\n  const relativeDates: Record<string, number> = {\n    'heute': 0,\n    'today': 0,\n    'morgen': 1,\n    'tomorrow': 1,\n    'übermorgen': 2,\n    'ubermorgen': 2,\n  };\n\n  // Check if it's a relative term\n  if (relativeDates[input] !== undefined) {\n    const targetDate = new Date(now);\n    targetDate.setDate(targetDate.getDate() + relativeDates[input]);\n    const result = targetDate.toISOString().split('T')[0];\n    console.log(`Relative date parsed: \"${dateInput}\" -> ${result}`);\n    return result;\n  }\n\n  // Check for \"in X tagen\" pattern\n  const inDaysMatch = input.match(/in\\s+(\\d+)\\s+tag/i);\n  if (inDaysMatch) {\n    const days = parseInt(inDaysMatch[1], 10);\n    const targetDate = new Date(now);\n    targetDate.setDate(targetDate.getDate() + days);\n    const result = targetDate.toISOString().split('T')[0];\n    console.log(`Relative date parsed: \"${dateInput}\" -> ${result}`);\n    return result;\n  }\n\n  // Check for weekday names (nächsten Montag, etc.)\n  const weekdays: Record<string, number> = {\n    'sonntag': 0, 'sunday': 0,\n    'montag': 1, 'monday': 1,\n    'dienstag': 2, 'tuesday': 2,\n    'mittwoch': 3, 'wednesday': 3,\n    'donnerstag': 4, 'thursday': 4,\n    'freitag': 5, 'friday': 5,\n    'samstag': 6, 'saturday': 6,\n  };\n\n  for (const [dayName, dayNum] of Object.entries(weekdays)) {\n    if (input.includes(dayName)) {\n      const currentDay = now.getDay();\n      let daysToAdd = dayNum - currentDay;\n      if (daysToAdd <= 0) daysToAdd += 7; // Next week if today or past\n      const targetDate = new Date(now);\n      targetDate.setDate(targetDate.getDate() + daysToAdd);\n      const result = targetDate.toISOString().split('T')[0];\n      console.log(`Weekday parsed: \"${dateInput}\" -> ${result}`);\n      return result;\n    }\n  }\n\n  // If it looks like a date (contains numbers), pass to validateAndCorrectDate\n  if (/\\d{4}-\\d{2}-\\d{2}/.test(input)) {\n    return validateAndCorrectDate(dateInput);\n  }\n\n  // Fallback: return as-is and let validateAndCorrectDate handle it\n  console.warn(`Could not parse date input: \"${dateInput}\", attempting validation`);\n  return validateAndCorrectDate(dateInput);\n}",
  "new_string": "// ============================================================================\n// DATE PARSING FUNCTIONS\n// ============================================================================\n\n/**\n * Time range definitions for natural language time preferences\n */\nexport const TIME_RANGES: Record<string, { start: number; end: number }> = {\n  'morgens': { start: 9, end: 12 },\n  'vormittags': { start: 9, end: 12 },\n  'mittags': { start: 12, end: 14 },\n  'nachmittags': { start: 14, end: 17 },\n  'abends': { start: 17, end: 20 },\n  'morning': { start: 9, end: 12 },\n  'afternoon': { start: 14, end: 17 },\n  'evening': { start: 17, end: 20 },\n};\n\n/**\n * Parse a date input that can be either a relative term (morgen, heute, übermorgen)\n * or an ISO date string. Returns the resolved date in YYYY-MM-DD format.\n *\n * Enhanced with:\n * - Extended relative date patterns\n * - Week-based expressions (diese Woche, nächste Woche)\n * - Month expressions (nächsten Monat, Anfang Januar)\n * - Better error handling\n *\n * @param dateInput - Either a relative term or YYYY-MM-DD date string\n * @returns Resolved date in YYYY-MM-DD format\n */\nexport function parseDateInput(dateInput: string): string {\n  const input = dateInput.toLowerCase().trim();\n  const now = new Date();\n\n  // German relative date terms (expanded)\n  const relativeDates: Record<string, number> = {\n    'heute': 0,\n    'today': 0,\n    'jetzt': 0,\n    'now': 0,\n    'morgen': 1,\n    'tomorrow': 1,\n    'übermorgen': 2,\n    'ubermorgen': 2,\n    'in zwei tagen': 2,\n    'in 2 tagen': 2,\n  };\n\n  // Check if it's a simple relative term\n  if (relativeDates[input] !== undefined) {\n    const targetDate = new Date(now);\n    targetDate.setDate(targetDate.getDate() + relativeDates[input]);\n    const result = targetDate.toISOString().split('T')[0];\n    console.log(`Relative date parsed: \"${dateInput}\" -> ${result}`);\n    return result;\n  }\n\n  // Check for \"in X tagen/wochen\" patterns\n  const inDaysMatch = input.match(/in\\s+(\\d+)\\s+tag/i);\n  if (inDaysMatch) {\n    const days = parseInt(inDaysMatch[1], 10);\n    const targetDate = new Date(now);\n    targetDate.setDate(targetDate.getDate() + days);\n    const result = targetDate.toISOString().split('T')[0];\n    console.log(`Relative date parsed: \"${dateInput}\" -> ${result}`);\n    return result;\n  }\n\n  const inWeeksMatch = input.match(/in\\s+(\\d+)\\s+woche/i);\n  if (inWeeksMatch) {\n    const weeks = parseInt(inWeeksMatch[1], 10);\n    const targetDate = new Date(now);\n    targetDate.setDate(targetDate.getDate() + weeks * 7);\n    const result = targetDate.toISOString().split('T')[0];\n    console.log(`Relative weeks parsed: \"${dateInput}\" -> ${result}`);\n    return result;\n  }\n\n  // Handle \"diese Woche\" (this week) - return today\n  if (input.includes('diese woche') || input.includes('this week')) {\n    const result = now.toISOString().split('T')[0];\n    console.log(`This week parsed: \"${dateInput}\" -> ${result}`);\n    return result;\n  }\n\n  // Handle \"nächste Woche\" (next week) - return next Monday\n  if (input.includes('naechste woche') || input.includes('nächste woche') || input.includes('next week')) {\n    const currentDay = now.getDay();\n    const daysToMonday = currentDay === 0 ? 1 : 8 - currentDay;\n    const targetDate = new Date(now);\n    targetDate.setDate(targetDate.getDate() + daysToMonday);\n    const result = targetDate.toISOString().split('T')[0];\n    console.log(`Next week parsed: \"${dateInput}\" -> ${result}`);\n    return result;\n  }\n\n  // Check for weekday names (nächsten Montag, am Freitag, etc.)\n  const weekdays: Record<string, number> = {\n    'sonntag': 0, 'sunday': 0,\n    'montag': 1, 'monday': 1,\n    'dienstag': 2, 'tuesday': 2,\n    'mittwoch': 3, 'wednesday': 3,\n    'donnerstag': 4, 'thursday': 4,\n    'freitag': 5, 'friday': 5,\n    'samstag': 6, 'saturday': 6,\n  };\n\n  for (const [dayName, dayNum] of Object.entries(weekdays)) {\n    if (input.includes(dayName)) {\n      const currentDay = now.getDay();\n      let daysToAdd = dayNum - currentDay;\n      if (daysToAdd <= 0) daysToAdd += 7; // Next week if today or past\n      const targetDate = new Date(now);\n      targetDate.setDate(targetDate.getDate() + daysToAdd);\n      const result = targetDate.toISOString().split('T')[0];\n      console.log(`Weekday parsed: \"${dateInput}\" -> ${result}`);\n      return result;\n    }\n  }\n\n  // If it looks like a date (contains numbers), pass to validateAndCorrectDate\n  if (/\\d{4}-\\d{2}-\\d{2}/.test(input)) {\n    return validateAndCorrectDate(dateInput);\n  }\n\n  // Fallback: return as-is and let validateAndCorrectDate handle it\n  console.warn(`Could not parse date input: \"${dateInput}\", attempting validation`);\n  return validateAndCorrectDate(dateInput);\n}\n\n/**\n * Parse natural language time expressions into HH:MM format\n *\n * Handles German and English time expressions:\n * - \"14 Uhr\" -> \"14:00\"\n * - \"halb drei\" -> \"14:30\"\n * - \"viertel nach zehn\" -> \"10:15\"\n * - \"viertel vor elf\" -> \"10:45\"\n * - \"10 Uhr morgens\" -> \"10:00\"\n * - \"3 Uhr nachmittags\" -> \"15:00\"\n *\n * @param timeInput - Natural language time expression\n * @returns Time string in HH:MM format\n */\nexport function parseTimeInput(timeInput: string): string {\n  const input = timeInput.toLowerCase().trim();\n\n  // Already in HH:MM format\n  if (/^\\d{1,2}:\\d{2}$/.test(input)) {\n    const [hours, minutes] = input.split(':').map(Number);\n    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;\n  }\n\n  // German number words to digits\n  const numberWords: Record<string, number> = {\n    'eins': 1, 'ein': 1, 'eine': 1,\n    'zwei': 2,\n    'drei': 3,\n    'vier': 4,\n    'fünf': 5, 'fuenf': 5,\n    'sechs': 6,\n    'sieben': 7,\n    'acht': 8,\n    'neun': 9,\n    'zehn': 10,\n    'elf': 11,\n    'zwölf': 12, 'zwoelf': 12,\n  };\n\n  // \"X Uhr\" pattern (e.g., \"14 Uhr\", \"zehn Uhr\")\n  const uhrMatch = input.match(/(\\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)\\s*uhr/i);\n  if (uhrMatch) {\n    let hours = numberWords[uhrMatch[1]] || parseInt(uhrMatch[1], 10);\n\n    // Check for AM/PM indicators\n    if (input.includes('nachmittag') || input.includes('abend')) {\n      if (hours < 12) hours += 12;\n    } else if (input.includes('morgen') || input.includes('vormittag')) {\n      // Keep as-is (morning hours)\n    }\n\n    return `${hours.toString().padStart(2, '0')}:00`;\n  }\n\n  // \"halb X\" pattern (half past the previous hour, e.g., \"halb drei\" = 14:30 or 2:30)\n  const halbMatch = input.match(/halb\\s*(\\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)/i);\n  if (halbMatch) {\n    let hours = numberWords[halbMatch[1]] || parseInt(halbMatch[1], 10);\n    hours = hours - 1; // \"halb drei\" means 2:30 in German\n    if (hours < 0) hours = 23;\n\n    // Default to afternoon for small numbers\n    if (hours > 0 && hours < 8 && !input.includes('morgen') && !input.includes('vormittag')) {\n      hours += 12;\n    }\n\n    return `${hours.toString().padStart(2, '0')}:30`;\n  }\n\n  // \"viertel nach X\" pattern (quarter past)\n  const viertelNachMatch = input.match(/viertel\\s*nach\\s*(\\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)/i);\n  if (viertelNachMatch) {\n    let hours = numberWords[viertelNachMatch[1]] || parseInt(viertelNachMatch[1], 10);\n    return `${hours.toString().padStart(2, '0')}:15`;\n  }\n\n  // \"viertel vor X\" pattern (quarter to)\n  const viertelVorMatch = input.match(/viertel\\s*vor\\s*(\\d{1,2}|eins?|zwei|drei|vier|fuenf|fünf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwölf)/i);\n  if (viertelVorMatch) {\n    let hours = numberWords[viertelVorMatch[1]] || parseInt(viertelVorMatch[1], 10);\n    hours = hours - 1;\n    if (hours < 0) hours = 23;\n    return `${hours.toString().padStart(2, '0')}:45`;\n  }\n\n  // Bare number with context (e.g., \"um 14\", \"um 3\")\n  const bareNumberMatch = input.match(/(?:um\\s*)?(\\d{1,2})(?:\\s|$)/);\n  if (bareNumberMatch) {\n    let hours = parseInt(bareNumberMatch[1], 10);\n\n    // Apply AM/PM logic\n    if (input.includes('nachmittag') || input.includes('abend')) {\n      if (hours < 12) hours += 12;\n    }\n\n    return `${hours.toString().padStart(2, '0')}:00`;\n  }\n\n  // Return original if no pattern matched\n  console.warn(`Could not parse time input: \"${timeInput}\"`);\n  return timeInput;\n}"
}

Now let me add the conflict detection function to the calendar library:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\calendar.ts",
  "old_string": "/**\n * Check if a specific time slot is available\n *\n * @param oauth2Client - Authenticated OAuth2 client\n * @param startTime - Start time to check (ISO datetime)\n * @param endTime - End time to check (ISO datetime)\n * @param timeZone - IANA timezone\n * @returns true if the slot is available, false if busy\n */\nexport async function isSlotAvailable(\n  oauth2Client: OAuth2Client,\n  startTime: string,\n  endTime: string,\n  timeZone: string = 'America/New_York'\n): Promise<boolean> {\n  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });\n\n  try {\n    const freebusyResponse = await calendar.freebusy.query({\n      requestBody: {\n        timeMin: startTime,\n        timeMax: endTime,\n        timeZone,\n        items: [{ id: 'primary' }],\n      },\n    });\n\n    const busyPeriods = freebusyResponse.data.calendars?.primary?.busy || [];\n    return busyPeriods.length === 0;\n  } catch (error) {\n    console.error('Error checking slot availability:', error);\n    throw wrapError(error, 'Failed to check slot availability');\n  }\n}",
  "new_string": "/**\n * Check if a specific time slot is available\n *\n * @param oauth2Client - Authenticated OAuth2 client\n * @param startTime - Start time to check (ISO datetime)\n * @param endTime - End time to check (ISO datetime)\n * @param timeZone - IANA timezone\n * @returns true if the slot is available, false if busy\n */\nexport async function isSlotAvailable(\n  oauth2Client: OAuth2Client,\n  startTime: string,\n  endTime: string,\n  timeZone: string = 'America/New_York'\n): Promise<boolean> {\n  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });\n\n  try {\n    const freebusyResponse = await calendar.freebusy.query({\n      requestBody: {\n        timeMin: startTime,\n        timeMax: endTime,\n        timeZone,\n        items: [{ id: 'primary' }],\n      },\n    });\n\n    const busyPeriods = freebusyResponse.data.calendars?.primary?.busy || [];\n    return busyPeriods.length === 0;\n  } catch (error) {\n    console.error('Error checking slot availability:', error);\n    throw wrapError(error, 'Failed to check slot availability');\n  }\n}\n\n/**\n * Conflict check result with alternative slots\n */\nexport interface ConflictCheckResult {\n  hasConflict: boolean;\n  conflictingEvents: Array<{\n    summary: string;\n    start: string;\n    end: string;\n  }>;\n  alternativeSlots: TimeSlot[];\n  message: string;\n}\n\n/**\n * Check for conflicts with existing appointments and suggest alternatives\n *\n * This enhanced conflict detection:\n * - Checks if the requested time slot conflicts with existing events\n * - Returns details about conflicting events\n * - Suggests up to 3 alternative time slots on the same day\n * - Provides a human-readable message for the voice assistant\n *\n * @param oauth2Client - Authenticated OAuth2 client\n * @param date - Date to check (YYYY-MM-DD)\n * @param time - Time to check (HH:MM)\n * @param durationMinutes - Duration of the requested appointment\n * @param timeZone - IANA timezone\n * @returns Conflict check result with alternatives\n */\nexport async function checkConflicts(\n  oauth2Client: OAuth2Client,\n  date: string,\n  time: string,\n  durationMinutes: number = DEFAULT_APPOINTMENT_DURATION_MINUTES,\n  timeZone: string = 'Europe/Berlin'\n): Promise<ConflictCheckResult> {\n  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });\n\n  // Parse the requested time slot\n  const startDateTime = parseDateTime(date, time, timeZone);\n  const [datePart, timePart] = startDateTime.split('T');\n  const [hh, mm] = timePart.split(':').map(Number);\n  let totalMinutes = hh * 60 + mm + durationMinutes;\n  const endHour = Math.floor(totalMinutes / 60) % 24;\n  const endMin = totalMinutes % 60;\n  const endDateTime = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;\n\n  try {\n    // Check freebusy for the requested time slot\n    const freebusyResponse = await calendar.freebusy.query({\n      requestBody: {\n        timeMin: `${startDateTime}`,\n        timeMax: `${endDateTime}`,\n        timeZone,\n        items: [{ id: 'primary' }],\n      },\n    });\n\n    const busyPeriods = freebusyResponse.data.calendars?.primary?.busy || [];\n\n    if (busyPeriods.length === 0) {\n      // No conflict - slot is available\n      return {\n        hasConflict: false,\n        conflictingEvents: [],\n        alternativeSlots: [],\n        message: `Der Termin um ${time} Uhr ist verfügbar.`,\n      };\n    }\n\n    // Get details about conflicting events\n    const startOfDay = new Date(date);\n    startOfDay.setHours(0, 0, 0, 0);\n    const endOfDay = new Date(date);\n    endOfDay.setHours(23, 59, 59, 999);\n\n    const eventsResponse = await calendar.events.list({\n      calendarId: 'primary',\n      timeMin: startOfDay.toISOString(),\n      timeMax: endOfDay.toISOString(),\n      singleEvents: true,\n      orderBy: 'startTime',\n    });\n\n    const events = eventsResponse.data.items || [];\n    const conflictingEvents = events\n      .filter(event => {\n        if (!event.start?.dateTime || !event.end?.dateTime) return false;\n        const eventStart = new Date(event.start.dateTime).getTime();\n        const eventEnd = new Date(event.end.dateTime).getTime();\n        const requestedStart = new Date(`${startDateTime}`).getTime();\n        const requestedEnd = new Date(`${endDateTime}`).getTime();\n        return (requestedStart < eventEnd && requestedEnd > eventStart);\n      })\n      .map(event => ({\n        summary: event.summary || 'Termin',\n        start: event.start?.dateTime || '',\n        end: event.end?.dateTime || '',\n      }));\n\n    // Find alternative slots on the same day\n    const targetDate = new Date(date);\n    const availableSlots = await getAvailableSlots(oauth2Client, targetDate, timeZone, durationMinutes);\n    const alternativeSlots = availableSlots\n      .filter(slot => new Date(slot.start) > new Date()) // Only future slots\n      .slice(0, 3); // Limit to 3 alternatives\n\n    // Build human-readable message\n    let message = `Um ${time} Uhr ist leider bereits ein Termin eingetragen.`;\n    if (alternativeSlots.length > 0) {\n      const times = alternativeSlots.map(s => s.displayTime).join(', ');\n      message += ` Alternativ sind folgende Zeiten verfügbar: ${times}.`;\n    } else {\n      message += ` Leider sind heute keine weiteren Termine mehr frei.`;\n    }\n\n    return {\n      hasConflict: true,\n      conflictingEvents,\n      alternativeSlots,\n      message,\n    };\n  } catch (error) {\n    console.error('Error checking conflicts:', error);\n    throw wrapError(error, 'Failed to check for conflicts');\n  }\n}\n\n/**\n * Filter available slots by preferred time range\n *\n * @param slots - Available slots to filter\n * @param preferredTimeRange - Time range preference (morgens, nachmittags, etc.)\n * @param timeZone - IANA timezone\n * @returns Filtered slots within the preferred time range\n */\nexport function filterSlotsByTimeRange(\n  slots: TimeSlot[],\n  preferredTimeRange: string,\n  timeZone: string = 'Europe/Berlin'\n): TimeSlot[] {\n  const range = TIME_RANGES[preferredTimeRange.toLowerCase()];\n  if (!range) return slots;\n\n  return slots.filter(slot => {\n    const slotDate = new Date(slot.start);\n    const hours = parseInt(\n      slotDate.toLocaleTimeString('en-US', {\n        hour: '2-digit',\n        hour12: false,\n        timeZone,\n      }),\n      10\n    );\n    return hours >= range.start && hours < range.end;\n  });\n}"
}

Now let me update the todo and work on adding the webhook handler for the new functions:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "completed",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "completed",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "in_progress",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "pending",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "pending",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "pending",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "pending",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

Now let me update the webhook handler to add the new `check_conflicts` handler and enhance the conversational responses:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "old_string": "import {\n  getAvailableSlots,\n  bookAppointment,\n  parseDateTime,\n  parseDateInput,\n  parseRecurrenceInput,\n  rescheduleEvent,\n  deleteEvent,\n  cancelRecurringInstance,\n  listEvents,\n  searchEvents,\n  findNextAvailableSlot,\n  CalendarError,\n  CalendarErrorType,\n} from '@/lib/google/calendar';",
  "new_string": "import {\n  getAvailableSlots,\n  bookAppointment,\n  parseDateTime,\n  parseDateInput,\n  parseTimeInput,\n  parseRecurrenceInput,\n  rescheduleEvent,\n  deleteEvent,\n  cancelRecurringInstance,\n  listEvents,\n  searchEvents,\n  findNextAvailableSlot,\n  checkConflicts,\n  filterSlotsByTimeRange,\n  CalendarError,\n  CalendarErrorType,\n} from '@/lib/google/calendar';"
}

Now let me update the check_availability handler to support time range filtering and add the new check_conflicts handler:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "old_string": "            case 'check_availability': {\n              // Get agent's user and check Google connection\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';\n                break;\n              }\n\n              try {\n                const timeZone = args.timeZone || 'Europe/Berlin';\n                const correctedDateStr = parseDateInput(args.date);\n                const date = new Date(correctedDateStr);\n                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;\n                const slots = await getAvailableSlots(oauth2Client, date, timeZone, appointmentDuration);\n\n                // Format date in German\n                const formattedDate = formatDateGerman(date);\n\n                if (slots.length === 0) {\n                  result = `Am ${formattedDate} sind leider keine Termine mehr frei. Möchten Sie einen anderen Tag versuchen?`;\n                } else {\n                  const slotList = slots.slice(0, 5).map(s => s.displayTime).join(', ');\n                  result = `Am ${formattedDate} habe ich folgende Zeiten verfügbar: ${slotList}. Welche Zeit passt Ihnen am besten?`;\n                }\n              } catch (error) {\n                console.error('Calendar availability error:', error);\n                result = 'Ich habe gerade Schwierigkeiten, den Kalender zu prüfen. Bitte versuchen Sie es noch einmal.';\n              }\n              break;\n            }",
  "new_string": "            case 'check_availability': {\n              // Get agent's user and check Google connection\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';\n                break;\n              }\n\n              try {\n                const timeZone = args.timeZone || 'Europe/Berlin';\n                const correctedDateStr = parseDateInput(args.date);\n                const date = new Date(correctedDateStr);\n                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;\n                let slots = await getAvailableSlots(oauth2Client, date, timeZone, appointmentDuration);\n\n                // Filter by preferred time range if specified\n                if (args.preferredTimeRange && slots.length > 0) {\n                  const filteredSlots = filterSlotsByTimeRange(slots, args.preferredTimeRange, timeZone);\n                  if (filteredSlots.length > 0) {\n                    slots = filteredSlots;\n                  }\n                }\n\n                // Format date in German\n                const formattedDate = formatDateGerman(date);\n\n                if (slots.length === 0) {\n                  // Try to find the next available day\n                  const nextSlot = await findNextAvailableSlot(oauth2Client, date, timeZone, appointmentDuration);\n                  if (nextSlot) {\n                    const nextDate = new Date(nextSlot.start);\n                    const nextFormattedDate = formatDateGerman(nextDate);\n                    result = `Am ${formattedDate} sind leider keine Termine mehr frei. Der nächste freie Termin wäre am ${nextFormattedDate} um ${nextSlot.displayTime}. Passt Ihnen das?`;\n                  } else {\n                    result = `Am ${formattedDate} sind leider keine Termine mehr frei. Möchten Sie einen anderen Tag versuchen?`;\n                  }\n                } else {\n                  const slotList = slots.slice(0, 5).map(s => s.displayTime).join(', ');\n                  if (args.preferredTimeRange) {\n                    result = `Am ${formattedDate} habe ich ${args.preferredTimeRange} folgende Zeiten verfügbar: ${slotList}. Welche Zeit passt Ihnen am besten?`;\n                  } else {\n                    result = `Am ${formattedDate} habe ich folgende Zeiten verfügbar: ${slotList}. Welche Zeit passt Ihnen am besten?`;\n                  }\n                }\n              } catch (error) {\n                console.error('Calendar availability error:', error);\n                result = 'Ich habe gerade Schwierigkeiten, den Kalender zu prüfen. Bitte versuchen Sie es noch einmal.';\n              }\n              break;\n            }\n\n            case 'check_conflicts': {\n              // Get agent's user and check Google connection\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';\n                break;\n              }\n\n              try {\n                const timeZone = args.timeZone || 'Europe/Berlin';\n                const correctedDateStr = parseDateInput(args.date);\n                const parsedTime = parseTimeInput(args.time);\n                const appointmentDuration = args.durationMinutes || agentWithUser.user.appointmentDuration || 30;\n\n                const conflictResult = await checkConflicts(\n                  oauth2Client,\n                  correctedDateStr,\n                  parsedTime,\n                  appointmentDuration,\n                  timeZone\n                );\n\n                result = conflictResult.message;\n              } catch (error) {\n                console.error('Conflict check error:', error);\n                result = 'Ich konnte die Verfügbarkeit nicht prüfen. Bitte versuchen Sie es noch einmal.';\n              }\n              break;\n            }"
}

Now let me enhance the book_appointment handler to support additional attendees, notes, and better time parsing:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "old_string": "            case 'book_appointment': {\n              // Get agent's user and check Google connection\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';\n                break;\n              }\n\n              try {\n                const timeZone = args.timeZone || 'Europe/Berlin';\n                const correctedDateStr = parseDateInput(args.date);\n                const start = parseDateTime(correctedDateStr, args.time, timeZone);\n\n                // Use user's configured appointment duration\n                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;\n\n                // Calculate end time based on configured duration\n                const [datePart, timePart] = start.split('T');\n                const [hh, mm] = timePart.split(':').map(Number);\n                let totalMinutes = hh * 60 + mm + appointmentDuration;\n                const endHour = Math.floor(totalMinutes / 60) % 24;\n                const endMin = totalMinutes % 60;\n                const end = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;\n\n                // Parse recurrence if provided\n                const recurrence = args.recurrence ? parseRecurrenceInput(args.recurrence) : undefined;\n\n                const event = await bookAppointment(oauth2Client, {\n                  summary: args.summary || `Termin mit ${args.callerName}`,\n                  start,\n                  end,\n                  timeZone,\n                  attendeeEmail: args.callerEmail,\n                  description: `Per Sprachassistent gebucht.\\n\\nAnrufer: ${args.callerName}${args.callerPhone ? `\\nTelefon: ${args.callerPhone}` : ''}${args.callerEmail ? `\\nE-Mail: ${args.callerEmail}` : ''}`,\n                  recurrence: recurrence || undefined,\n                  location: args.location,\n                });\n\n                // Format date in German for confirmation (using corrected date)\n                const bookingDate = new Date(correctedDateStr);\n                const formattedDate = formatDateGerman(bookingDate);\n\n                if (recurrence) {\n                  const recurrenceText = args.recurrence.toLowerCase();\n                  result = `Ihr wiederkehrender Termin (${recurrenceText}) am ${formattedDate} um ${args.time} ist eingetragen. Vielen Dank, ${args.callerName}!`;\n                } else {\n                  result = `Ihr Termin am ${formattedDate} um ${args.time} ist eingetragen. Vielen Dank, ${args.callerName}!`;\n                }\n              } catch (error) {\n                console.error('Calendar booking error:', error);\n                if (error instanceof CalendarError && error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {\n                  result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';\n                } else {\n                  result = 'Den Termin konnte ich leider nicht eintragen. Dieser Zeitpunkt ist möglicherweise bereits belegt. Möchten Sie eine andere Zeit versuchen?';\n                }\n              }\n              break;\n            }",
  "new_string": "            case 'book_appointment': {\n              // Get agent's user and check Google connection\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet. Bitte rufen Sie später noch einmal an oder hinterlassen Sie Ihre Kontaktdaten.';\n                break;\n              }\n\n              try {\n                const timeZone = args.timeZone || 'Europe/Berlin';\n                const correctedDateStr = parseDateInput(args.date);\n                // Enhanced time parsing for natural language times\n                const parsedTime = parseTimeInput(args.time);\n                const start = parseDateTime(correctedDateStr, parsedTime, timeZone);\n\n                // Use user's configured appointment duration\n                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;\n\n                // Calculate end time based on configured duration\n                const [datePart, timePart] = start.split('T');\n                const [hh, mm] = timePart.split(':').map(Number);\n                let totalMinutes = hh * 60 + mm + appointmentDuration;\n                const endHour = Math.floor(totalMinutes / 60) % 24;\n                const endMin = totalMinutes % 60;\n                const end = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;\n\n                // Parse recurrence if provided\n                const recurrence = args.recurrence ? parseRecurrenceInput(args.recurrence) : undefined;\n\n                // Build description with all available information\n                let description = 'Per Sprachassistent gebucht.';\n                description += `\\n\\nAnrufer: ${args.callerName}`;\n                if (args.callerPhone) description += `\\nTelefon: ${args.callerPhone}`;\n                if (args.callerEmail) description += `\\nE-Mail: ${args.callerEmail}`;\n                if (args.notes) description += `\\n\\nNotizen: ${args.notes}`;\n\n                // Handle multiple attendees if provided\n                const attendeeEmails: string[] = [];\n                if (args.callerEmail) attendeeEmails.push(args.callerEmail);\n                if (args.attendees) {\n                  const additionalAttendees = args.attendees.split(',').map((e: string) => e.trim()).filter((e: string) => e);\n                  attendeeEmails.push(...additionalAttendees);\n                }\n\n                const event = await bookAppointment(oauth2Client, {\n                  summary: args.summary || `Termin mit ${args.callerName}`,\n                  start,\n                  end,\n                  timeZone,\n                  attendeeEmail: attendeeEmails[0],\n                  attendeeEmails: attendeeEmails.length > 1 ? attendeeEmails : undefined,\n                  description,\n                  recurrence: recurrence || undefined,\n                  location: args.location,\n                });\n\n                // Format date in German for confirmation (using corrected date)\n                const bookingDate = new Date(correctedDateStr);\n                const formattedDate = formatDateGerman(bookingDate);\n                const displayTime = parsedTime;\n\n                // Build confirmation message\n                let confirmationMsg = `Wunderbar, Ihr Termin am ${formattedDate} um ${displayTime} Uhr ist eingetragen.`;\n\n                if (recurrence) {\n                  const recurrenceText = args.recurrence.toLowerCase();\n                  confirmationMsg = `Wunderbar, Ihr wiederkehrender Termin (${recurrenceText}) beginnend am ${formattedDate} um ${displayTime} Uhr ist eingetragen.`;\n                }\n\n                if (args.callerEmail) {\n                  confirmationMsg += ' Sie erhalten eine Kalendereinladung per E-Mail.';\n                }\n\n                confirmationMsg += ` Vielen Dank, ${args.callerName}!`;\n\n                if (args.location) {\n                  confirmationMsg += ` Der Termin findet statt in: ${args.location}.`;\n                }\n\n                result = confirmationMsg;\n              } catch (error) {\n                console.error('Calendar booking error:', error);\n                if (error instanceof CalendarError) {\n                  if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {\n                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';\n                  } else if (error.type === CalendarErrorType.CONFLICT) {\n                    result = 'Dieser Zeitpunkt ist leider bereits belegt. Möchten Sie eine andere Zeit versuchen? Ich kann Ihnen gerne die verfügbaren Zeiten nennen.';\n                  } else {\n                    result = 'Den Termin konnte ich leider nicht eintragen. Möchten Sie eine andere Zeit versuchen?';\n                  }\n                } else {\n                  result = 'Den Termin konnte ich leider nicht eintragen. Dieser Zeitpunkt ist möglicherweise bereits belegt. Möchten Sie eine andere Zeit versuchen?';\n                }\n              }\n              break;\n            }"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "completed",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "completed",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "completed",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "in_progress",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "pending",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "pending",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "pending",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

Now let me also update the reschedule and cancel handlers with enhanced time parsing:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "old_string": "            case 'reschedule_appointment': {\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';\n                break;\n              }\n\n              try {\n                const timeZone = args.timeZone || 'Europe/Berlin';\n                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;\n\n                // If no eventId, try to find by caller name\n                let eventId = args.eventId;\n                if (!eventId && args.callerName) {\n                  const events = await searchEvents(oauth2Client, args.callerName, { maxResults: 5, daysAhead: 30 });\n                  if (events.length > 0) {\n                    eventId = events[0].id;\n                  }\n                }\n\n                if (!eventId) {\n                  result = 'Ich konnte keinen Termin unter diesem Namen finden. Könnten Sie mir mehr Details geben?';\n                  break;\n                }\n\n                const correctedDateStr = parseDateInput(args.newDate);\n                const start = parseDateTime(correctedDateStr, args.newTime, timeZone);\n\n                // Calculate end time\n                const [datePart, timePart] = start.split('T');\n                const [hh, mm] = timePart.split(':').map(Number);\n                let totalMinutes = hh * 60 + mm + appointmentDuration;\n                const endHour = Math.floor(totalMinutes / 60) % 24;\n                const endMin = totalMinutes % 60;\n                const end = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;\n\n                await rescheduleEvent(oauth2Client, eventId, start, end, timeZone);\n\n                const newDate = new Date(correctedDateStr);\n                const formattedDate = formatDateGerman(newDate);\n                result = `Ihr Termin wurde auf ${formattedDate} um ${args.newTime} verschoben.`;\n              } catch (error) {\n                console.error('Calendar reschedule error:', error);\n                if (error instanceof CalendarError) {\n                  if (error.type === CalendarErrorType.EVENT_NOT_FOUND) {\n                    result = 'Ich konnte diesen Termin nicht finden. Wurde er möglicherweise bereits storniert?';\n                  } else if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {\n                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';\n                  } else {\n                    result = 'Das Verschieben des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                  }\n                } else {\n                  result = 'Das Verschieben des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                }\n              }\n              break;\n            }",
  "new_string": "            case 'reschedule_appointment': {\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';\n                break;\n              }\n\n              try {\n                const timeZone = args.timeZone || 'Europe/Berlin';\n                const appointmentDuration = agentWithUser.user.appointmentDuration || 30;\n\n                // If no eventId, try to find by caller name\n                let eventId = args.eventId;\n                let originalEventSummary = '';\n                if (!eventId && args.callerName) {\n                  const events = await searchEvents(oauth2Client, args.callerName, { maxResults: 5, daysAhead: 30 });\n                  if (events.length > 0) {\n                    // If multiple events found and originalDate provided, try to match\n                    if (events.length > 1 && args.originalDate) {\n                      const originalDateStr = parseDateInput(args.originalDate);\n                      const matchingEvent = events.find(e => e.start.includes(originalDateStr));\n                      if (matchingEvent) {\n                        eventId = matchingEvent.id;\n                        originalEventSummary = matchingEvent.summary;\n                      }\n                    }\n                    if (!eventId) {\n                      eventId = events[0].id;\n                      originalEventSummary = events[0].summary;\n                    }\n                  }\n                }\n\n                if (!eventId) {\n                  result = 'Ich konnte keinen Termin unter diesem Namen finden. Könnten Sie mir den Namen nennen, unter dem der Termin gebucht wurde?';\n                  break;\n                }\n\n                const correctedDateStr = parseDateInput(args.newDate);\n                const parsedTime = parseTimeInput(args.newTime);\n                const start = parseDateTime(correctedDateStr, parsedTime, timeZone);\n\n                // Check if new slot is available before rescheduling\n                const conflictCheck = await checkConflicts(oauth2Client, correctedDateStr, parsedTime, appointmentDuration, timeZone);\n                if (conflictCheck.hasConflict) {\n                  result = `Der neue Zeitpunkt um ${parsedTime} Uhr ist leider bereits belegt. ` +\n                    (conflictCheck.alternativeSlots.length > 0\n                      ? `Stattdessen wären verfügbar: ${conflictCheck.alternativeSlots.map(s => s.displayTime).join(', ')}. Möchten Sie eine dieser Zeiten?`\n                      : 'Möchten Sie einen anderen Zeitpunkt versuchen?');\n                  break;\n                }\n\n                // Calculate end time\n                const [datePart, timePart] = start.split('T');\n                const [hh, mm] = timePart.split(':').map(Number);\n                let totalMinutes = hh * 60 + mm + appointmentDuration;\n                const endHour = Math.floor(totalMinutes / 60) % 24;\n                const endMin = totalMinutes % 60;\n                const end = `${datePart}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;\n\n                await rescheduleEvent(oauth2Client, eventId, start, end, timeZone);\n\n                const newDate = new Date(correctedDateStr);\n                const formattedDate = formatDateGerman(newDate);\n                result = `Alles klar, Ihr Termin wurde erfolgreich auf ${formattedDate} um ${parsedTime} Uhr verschoben. Alle Teilnehmer werden benachrichtigt.`;\n              } catch (error) {\n                console.error('Calendar reschedule error:', error);\n                if (error instanceof CalendarError) {\n                  if (error.type === CalendarErrorType.EVENT_NOT_FOUND) {\n                    result = 'Ich konnte diesen Termin nicht finden. Wurde er möglicherweise bereits storniert?';\n                  } else if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {\n                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';\n                  } else if (error.type === CalendarErrorType.CONFLICT) {\n                    result = 'Der gewünschte Zeitpunkt ist leider bereits belegt. Möchten Sie eine andere Zeit versuchen?';\n                  } else {\n                    result = 'Das Verschieben des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                  }\n                } else {\n                  result = 'Das Verschieben des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                }\n              }\n              break;\n            }"
}

Now let me update the cancel_appointment handler to include the reason parameter:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "offset": 697,
  "limit": 80
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\webhooks\\vapi\\route.ts",
  "old_string": "            case 'cancel_appointment': {\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';\n                break;\n              }\n\n              try {\n                // If no eventId, try to find by caller name\n                let eventId = args.eventId;\n                if (!eventId && args.callerName) {\n                  const events = await searchEvents(oauth2Client, args.callerName, { maxResults: 5, daysAhead: 30 });\n                  if (events.length > 0) {\n                    eventId = events[0].id;\n                  }\n                }\n\n                if (!eventId) {\n                  result = 'Ich konnte keinen Termin unter diesem Namen finden. Könnten Sie mir mehr Details geben?';\n                  break;\n                }\n\n                // Check if this is a recurring event and user wants to cancel only one instance\n                if (args.date && args.cancelAll !== 'ja') {\n                  await cancelRecurringInstance(oauth2Client, eventId, args.date);\n                  result = 'Der Termin an diesem Datum wurde storniert.';\n                } else {\n                  await deleteEvent(oauth2Client, eventId);\n                  result = 'Der Termin wurde erfolgreich storniert. Alle Teilnehmer werden benachrichtigt.';\n                }\n              } catch (error) {\n                console.error('Calendar cancel error:', error);\n                if (error instanceof CalendarError) {\n                  if (error.type === CalendarErrorType.EVENT_NOT_FOUND) {\n                    result = 'Ich konnte diesen Termin nicht finden. Wurde er möglicherweise bereits storniert?';\n                  } else if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {\n                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';\n                  } else {\n                    result = 'Das Stornieren des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                  }\n                } else {\n                  result = 'Das Stornieren des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                }\n              }\n              break;\n            }",
  "new_string": "            case 'cancel_appointment': {\n              const agentWithUser = await prisma.agent.findUnique({\n                where: { id: agent.id },\n                include: { user: true },\n              });\n\n              if (!agentWithUser?.user) {\n                result = 'Es tut mir leid, ich habe momentan technische Schwierigkeiten.';\n                break;\n              }\n\n              const oauth2Client = await getOAuth2ClientForUser(agentWithUser.user.id);\n              if (!oauth2Client) {\n                result = 'Leider ist die Kalenderbuchung noch nicht eingerichtet.';\n                break;\n              }\n\n              try {\n                // If no eventId, try to find by caller name\n                let eventId = args.eventId;\n                let eventSummary = '';\n                let eventDate = '';\n\n                if (!eventId && args.callerName) {\n                  const events = await searchEvents(oauth2Client, args.callerName, { maxResults: 5, daysAhead: 30 });\n                  if (events.length > 0) {\n                    // If date is provided, try to match the specific event\n                    if (events.length > 1 && args.date) {\n                      const targetDateStr = parseDateInput(args.date);\n                      const matchingEvent = events.find(e => e.start.includes(targetDateStr));\n                      if (matchingEvent) {\n                        eventId = matchingEvent.id;\n                        eventSummary = matchingEvent.summary;\n                        eventDate = matchingEvent.start;\n                      }\n                    }\n                    if (!eventId) {\n                      eventId = events[0].id;\n                      eventSummary = events[0].summary;\n                      eventDate = events[0].start;\n                    }\n                  }\n                }\n\n                if (!eventId) {\n                  result = 'Ich konnte keinen Termin unter diesem Namen finden. Könnten Sie mir bitte den Namen nennen, unter dem der Termin gebucht wurde?';\n                  break;\n                }\n\n                // Check if this is a recurring event and user wants to cancel only one instance\n                if (args.date && args.cancelAll !== 'ja') {\n                  const cancelDateStr = parseDateInput(args.date);\n                  await cancelRecurringInstance(oauth2Client, eventId, cancelDateStr);\n                  const formattedDate = formatDateGerman(new Date(cancelDateStr));\n                  result = `Der Termin am ${formattedDate} wurde storniert. Die anderen Termine der Serie bleiben bestehen.`;\n                } else {\n                  await deleteEvent(oauth2Client, eventId);\n                  // Build a more informative cancellation message\n                  let cancelMsg = 'Ihr Termin wurde erfolgreich storniert.';\n                  if (eventDate) {\n                    const formattedDate = formatDateGerman(new Date(eventDate));\n                    cancelMsg = `Ihr Termin am ${formattedDate} wurde erfolgreich storniert.`;\n                  }\n                  if (args.reason) {\n                    cancelMsg += ` Grund: ${args.reason}.`;\n                  }\n                  cancelMsg += ' Alle Teilnehmer werden benachrichtigt.';\n                  result = cancelMsg;\n                }\n              } catch (error) {\n                console.error('Calendar cancel error:', error);\n                if (error instanceof CalendarError) {\n                  if (error.type === CalendarErrorType.EVENT_NOT_FOUND) {\n                    result = 'Ich konnte diesen Termin nicht finden. Wurde er möglicherweise bereits storniert?';\n                  } else if (error.type === CalendarErrorType.AUTHENTICATION_EXPIRED) {\n                    result = 'Die Kalenderverbindung muss erneuert werden. Bitte versuchen Sie es später noch einmal.';\n                  } else {\n                    result = 'Das Stornieren des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                  }\n                } else {\n                  result = 'Das Stornieren des Termins ist leider fehlgeschlagen. Möchten Sie es noch einmal versuchen?';\n                }\n              }\n              break;\n            }"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "completed",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "completed",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "completed",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "completed",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "in_progress",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "pending",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "pending",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

Now let me update the system prompt template builder with better calendar instructions:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prompts\\template-builder.ts",
  "old_string": "/**\n * Build calendar functions section\n */\nfunction buildCalendarSection(): PromptSection {\n  return {\n    id: SECTION_IDS.CALENDAR,\n    title: 'Kalender-Funktionen',\n    content: `VERFUEGBARE TOOLS:\n- check_availability: Pruefen Sie die Kalenderverfuegbarkeit fuer ein bestimmtes Datum\n- book_appointment: Buchen Sie einen Termin im Kalender\n\nBUCHUNGSPROZESS:\n1. Immer zuerst die Verfuegbarkeit pruefen (check_availability)\n2. Freie Zeiten dem Anrufer nennen\n3. Alle erforderlichen Daten erfragen:\n   - Datum und Uhrzeit (erforderlich)\n   - Vollstaendiger Name (erforderlich)\n   - Telefonnummer (optional, aber empfohlen)\n   - E-Mail (optional)\n4. Details vor der Buchung zusammenfassen und bestaetigen\n5. Termin buchen (book_appointment)\n6. Buchungsbestaetigung geben\n\nWICHTIGE HINWEISE:\n- Relative Datumsangaben (morgen, naechsten Montag) anhand des aktuellen Datums berechnen\n- Bei unklaren Zeiten nachfragen\n- Nie ohne Bestaetigung des Anrufers buchen`,\n    priority: 60,\n    enabled: true,\n  };\n}",
  "new_string": "/**\n * Build calendar functions section with enhanced instructions\n */\nfunction buildCalendarSection(): PromptSection {\n  return {\n    id: SECTION_IDS.CALENDAR,\n    title: 'Kalender-Funktionen',\n    content: `VERFUEGBARE TOOLS:\n- check_availability: Pruefen Sie die Kalenderverfuegbarkeit (unterstuetzt Tageszeit-Filter wie \"morgens\", \"nachmittags\")\n- check_conflicts: Pruefen Sie ob ein gewuenschter Zeitpunkt frei ist (vor dem Buchen verwenden)\n- book_appointment: Buchen Sie einen Termin (unterstuetzt mehrere Teilnehmer, wiederkehrende Termine)\n- reschedule_appointment: Verschieben Sie einen bestehenden Termin\n- cancel_appointment: Stornieren Sie einen Termin\n- list_appointments: Zeigen Sie Termine in einem Zeitraum an\n- search_appointments: Suchen Sie nach spezifischen Terminen\n- find_next_available: Finden Sie den naechsten freien Termin\n\nBUCHUNGSPROZESS:\n1. Bei Terminwunsch: Zuerst Verfuegbarkeit pruefen (check_availability)\n2. Freie Zeiten dem Anrufer nennen und Praeferenz erfragen\n3. Folgende Daten sammeln:\n   - Datum und Uhrzeit (ERFORDERLICH)\n   - Vollstaendiger Name (ERFORDERLICH)\n   - Telefonnummer (empfohlen fuer Rueckruf)\n   - E-Mail-Adresse (fuer Kalendereinladung)\n   - Termingrund/Betreff (optional)\n4. Details zusammenfassen: \"Sie moechten also am [Datum] um [Uhrzeit] einen Termin? Ist das korrekt?\"\n5. Nach Bestaetigung: Termin buchen (book_appointment)\n6. Buchungsbestaetigung mit allen Details geben\n\nDATUMSVERARBEITUNG:\n- Relative Begriffe IMMER verwenden: \"morgen\", \"uebermorgen\", \"naechsten Montag\", \"Freitag\"\n- Bei Woechentagen: Den NAECHSTEN kommenden Tag nehmen\n- \"Diese Woche\" = ab heute, \"Naechste Woche\" = ab Montag\n- NIE alte Jahre wie 2023 oder 2024 verwenden - aktuelles Jahr beachten!\n\nZEITVERARBEITUNG (Deutsche Ausdruecke):\n- \"halb drei\" = 14:30 Uhr (NICHT 14:00!)\n- \"viertel nach zehn\" = 10:15 Uhr\n- \"viertel vor elf\" = 10:45 Uhr\n- \"3 Uhr nachmittags\" = 15:00 Uhr\n- Bei unklaren Zeiten: \"Meinen Sie vormittags oder nachmittags?\"\n\nKONFLIKTBEHANDLUNG:\n- Wenn gewuenschte Zeit belegt: Alternative Zeiten anbieten\n- check_conflicts gibt automatisch Alternativen zurueck\n- Nicht aufgeben - immer Alternativen vorschlagen\n\nWICHTIGE REGELN:\n- NIEMALS ohne explizite Bestaetigung des Anrufers buchen\n- Bei Aenderungen/Stornierungen: Nach dem Namen fragen um Termin zu finden\n- Bei mehreren Terminen: Datum zur Identifikation nutzen\n- Freundlich bleiben auch bei Fehlern - Loesungen anbieten`,\n    priority: 60,\n    enabled: true,\n  };\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "completed",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "completed",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "completed",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "completed",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "completed",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "in_progress",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "pending",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

Now let me check if there's an existing Playwright configuration in the project:

🔧 Tool: Glob
Input: {
  "pattern": "**/playwright*.{ts,js,json}",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.spec.ts",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && ls -la package.json",
  "description": "Check for package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\package.json"
}

I see the project uses Vitest for testing. Let me check if there's a Vitest config and existing tests:

🔧 Tool: Glob
Input: {
  "pattern": "**/*.test.ts",
  "path": "F:\\CodeBase\\Kametrix"
}

Good - the project already has tests. Let me check if there's an existing calendar test file to understand the test structure:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\__tests__\\calendar.test.ts"
}

Now I'll create a verification test file for the new calendar enhancements. Since the project uses Vitest, let me create a comprehensive test for the new features:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\__tests__\\calendar-enhancements.test.ts",
  "content": "/**\n * Verification tests for calendar enhancement features\n *\n * Tests the new capabilities added for improved AI voice agent\n * calendar operations including:\n * - Enhanced date parsing (weeks, relative expressions)\n * - Natural language time parsing (halb, viertel, etc.)\n * - Time range filtering\n * - Conflict detection interface\n */\n\nimport { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';\nimport {\n  parseDateInput,\n  parseTimeInput,\n  TIME_RANGES,\n  filterSlotsByTimeRange,\n  type TimeSlot,\n} from '../calendar';\n\ndescribe('parseDateInput - Enhanced Date Parsing', () => {\n  const originalConsoleWarn = console.warn;\n  const originalConsoleLog = console.log;\n\n  beforeEach(() => {\n    console.warn = vi.fn();\n    console.log = vi.fn();\n  });\n\n  afterEach(() => {\n    console.warn = originalConsoleWarn;\n    console.log = originalConsoleLog;\n  });\n\n  it('parses \"heute\" as today', () => {\n    const today = new Date().toISOString().split('T')[0];\n    expect(parseDateInput('heute')).toBe(today);\n  });\n\n  it('parses \"morgen\" as tomorrow', () => {\n    const tomorrow = new Date();\n    tomorrow.setDate(tomorrow.getDate() + 1);\n    expect(parseDateInput('morgen')).toBe(tomorrow.toISOString().split('T')[0]);\n  });\n\n  it('parses \"übermorgen\" as day after tomorrow', () => {\n    const dayAfter = new Date();\n    dayAfter.setDate(dayAfter.getDate() + 2);\n    expect(parseDateInput('übermorgen')).toBe(dayAfter.toISOString().split('T')[0]);\n  });\n\n  it('parses \"in 2 tagen\" as two days from now', () => {\n    const result = parseDateInput('in 2 tagen');\n    const expected = new Date();\n    expected.setDate(expected.getDate() + 2);\n    expect(result).toBe(expected.toISOString().split('T')[0]);\n  });\n\n  it('parses \"in 3 wochen\" as three weeks from now', () => {\n    const result = parseDateInput('in 3 wochen');\n    const expected = new Date();\n    expected.setDate(expected.getDate() + 21);\n    expect(result).toBe(expected.toISOString().split('T')[0]);\n  });\n\n  it('parses \"naechste woche\" as next Monday', () => {\n    const result = parseDateInput('naechste woche');\n    const resultDate = new Date(result);\n    // Should be a Monday (day 1)\n    expect(resultDate.getDay()).toBe(1);\n    // Should be in the future\n    expect(resultDate > new Date()).toBe(true);\n  });\n\n  it('parses weekday names correctly', () => {\n    const result = parseDateInput('Freitag');\n    const resultDate = new Date(result);\n    // Should be a Friday (day 5)\n    expect(resultDate.getDay()).toBe(5);\n    // Should be in the future\n    expect(resultDate > new Date()).toBe(true);\n  });\n\n  it('parses \"jetzt\" as today', () => {\n    const today = new Date().toISOString().split('T')[0];\n    expect(parseDateInput('jetzt')).toBe(today);\n  });\n\n  it('handles case-insensitive input', () => {\n    const tomorrow = new Date();\n    tomorrow.setDate(tomorrow.getDate() + 1);\n    expect(parseDateInput('MORGEN')).toBe(tomorrow.toISOString().split('T')[0]);\n    expect(parseDateInput('Morgen')).toBe(tomorrow.toISOString().split('T')[0]);\n  });\n});\n\ndescribe('parseTimeInput - German Time Expression Parsing', () => {\n  const originalConsoleWarn = console.warn;\n\n  beforeEach(() => {\n    console.warn = vi.fn();\n  });\n\n  afterEach(() => {\n    console.warn = originalConsoleWarn;\n  });\n\n  it('returns already formatted times unchanged', () => {\n    expect(parseTimeInput('14:30')).toBe('14:30');\n    expect(parseTimeInput('09:00')).toBe('09:00');\n    expect(parseTimeInput('9:30')).toBe('09:30');\n  });\n\n  it('parses \"X Uhr\" pattern', () => {\n    expect(parseTimeInput('14 Uhr')).toBe('14:00');\n    expect(parseTimeInput('10 uhr')).toBe('10:00');\n    expect(parseTimeInput('9 Uhr')).toBe('09:00');\n  });\n\n  it('parses German \"halb X\" pattern correctly (halb drei = 14:30)', () => {\n    // In German, \"halb drei\" means 2:30 (half to three)\n    const result = parseTimeInput('halb drei');\n    // Should be either 02:30 or 14:30 depending on context\n    expect(['02:30', '14:30']).toContain(result);\n  });\n\n  it('parses \"halb\" with afternoon default for business hours', () => {\n    // \"halb vier\" should default to afternoon (15:30) not morning (03:30)\n    const result = parseTimeInput('halb vier');\n    expect(result).toBe('15:30');\n  });\n\n  it('parses \"viertel nach X\" pattern', () => {\n    expect(parseTimeInput('viertel nach zehn')).toBe('10:15');\n    expect(parseTimeInput('viertel nach 10')).toBe('10:15');\n  });\n\n  it('parses \"viertel vor X\" pattern', () => {\n    expect(parseTimeInput('viertel vor elf')).toBe('10:45');\n    expect(parseTimeInput('viertel vor 11')).toBe('10:45');\n  });\n\n  it('parses time with AM/PM indicators', () => {\n    expect(parseTimeInput('3 Uhr nachmittags')).toBe('15:00');\n    expect(parseTimeInput('10 Uhr morgens')).toBe('10:00');\n  });\n\n  it('parses German number words', () => {\n    expect(parseTimeInput('zehn Uhr')).toBe('10:00');\n    expect(parseTimeInput('elf Uhr')).toBe('11:00');\n    expect(parseTimeInput('zwölf Uhr')).toBe('12:00');\n  });\n\n  it('handles bare numbers with \"um\"', () => {\n    expect(parseTimeInput('um 14')).toBe('14:00');\n    expect(parseTimeInput('um 9')).toBe('09:00');\n  });\n});\n\ndescribe('TIME_RANGES - Time Range Definitions', () => {\n  it('has correct morning range', () => {\n    expect(TIME_RANGES['morgens']).toEqual({ start: 9, end: 12 });\n    expect(TIME_RANGES['vormittags']).toEqual({ start: 9, end: 12 });\n  });\n\n  it('has correct afternoon range', () => {\n    expect(TIME_RANGES['nachmittags']).toEqual({ start: 14, end: 17 });\n  });\n\n  it('has correct midday range', () => {\n    expect(TIME_RANGES['mittags']).toEqual({ start: 12, end: 14 });\n  });\n\n  it('has correct evening range', () => {\n    expect(TIME_RANGES['abends']).toEqual({ start: 17, end: 20 });\n  });\n});\n\ndescribe('filterSlotsByTimeRange', () => {\n  const mockSlots: TimeSlot[] = [\n    { start: '2025-01-10T09:00:00', end: '2025-01-10T09:30:00', displayTime: '09:00' },\n    { start: '2025-01-10T10:00:00', end: '2025-01-10T10:30:00', displayTime: '10:00' },\n    { start: '2025-01-10T11:00:00', end: '2025-01-10T11:30:00', displayTime: '11:00' },\n    { start: '2025-01-10T14:00:00', end: '2025-01-10T14:30:00', displayTime: '14:00' },\n    { start: '2025-01-10T15:00:00', end: '2025-01-10T15:30:00', displayTime: '15:00' },\n    { start: '2025-01-10T16:00:00', end: '2025-01-10T16:30:00', displayTime: '16:00' },\n  ];\n\n  it('filters morning slots correctly', () => {\n    const result = filterSlotsByTimeRange(mockSlots, 'morgens');\n    expect(result.length).toBe(3);\n    expect(result.map(s => s.displayTime)).toEqual(['09:00', '10:00', '11:00']);\n  });\n\n  it('filters afternoon slots correctly', () => {\n    const result = filterSlotsByTimeRange(mockSlots, 'nachmittags');\n    expect(result.length).toBe(3);\n    expect(result.map(s => s.displayTime)).toEqual(['14:00', '15:00', '16:00']);\n  });\n\n  it('returns all slots for unknown range', () => {\n    const result = filterSlotsByTimeRange(mockSlots, 'unknown');\n    expect(result.length).toBe(mockSlots.length);\n  });\n\n  it('handles case-insensitive input', () => {\n    const result = filterSlotsByTimeRange(mockSlots, 'MORGENS');\n    expect(result.length).toBe(3);\n  });\n});\n\ndescribe('Tool Definitions Integration', () => {\n  it('exports CALENDAR_TOOL_NAMES including new check_conflicts', async () => {\n    const { CALENDAR_TOOL_NAMES } = await import('../../../prompts/tool-definitions');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_availability');\n    expect(CALENDAR_TOOL_NAMES).toContain('book_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_conflicts');\n    expect(CALENDAR_TOOL_NAMES).toContain('reschedule_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('cancel_appointment');\n  });\n\n  it('exports CALENDAR_INTENT_PATTERNS for AI guidance', async () => {\n    const { CALENDAR_INTENT_PATTERNS } = await import('../../../prompts/tool-definitions');\n    expect(CALENDAR_INTENT_PATTERNS).toBeDefined();\n    expect(CALENDAR_INTENT_PATTERNS.check_availability).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.book_appointment).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.find_next_available).toBeInstanceOf(Array);\n  });\n\n  it('buildCalendarTools includes check_conflicts tool', async () => {\n    const { buildCalendarTools } = await import('../../../prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const conflictTool = tools.find(t => t.function.name === 'check_conflicts');\n    expect(conflictTool).toBeDefined();\n    expect(conflictTool?.function.parameters.required).toContain('date');\n    expect(conflictTool?.function.parameters.required).toContain('time');\n  });\n\n  it('book_appointment tool has enhanced parameter descriptions', async () => {\n    const { buildCalendarTools } = await import('../../../prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const bookTool = tools.find(t => t.function.name === 'book_appointment');\n    expect(bookTool).toBeDefined();\n\n    const params = bookTool?.function.parameters.properties;\n    expect(params?.attendees).toBeDefined();\n    expect(params?.notes).toBeDefined();\n    expect(params?.time.description).toContain('halb drei');\n  });\n});\n\ndescribe('ConflictCheckResult Interface', () => {\n  it('checkConflicts function is exported', async () => {\n    const calendar = await import('../calendar');\n    expect(calendar.checkConflicts).toBeDefined();\n    expect(typeof calendar.checkConflicts).toBe('function');\n  });\n});\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "completed",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "completed",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "completed",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "completed",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "completed",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "completed",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "in_progress",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

Now let me run the verification tests:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test -- src/lib/google/__tests__/calendar-enhancements.test.ts 2>&1",
  "description": "Run verification tests",
  "timeout": 120000
}

Most tests pass. The failing tests are just due to import path issues - the actual calendar functionality tests all pass. Let me fix the import paths:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\__tests__\\calendar-enhancements.test.ts",
  "old_string": "describe('Tool Definitions Integration', () => {\n  it('exports CALENDAR_TOOL_NAMES including new check_conflicts', async () => {\n    const { CALENDAR_TOOL_NAMES } = await import('../../../prompts/tool-definitions');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_availability');\n    expect(CALENDAR_TOOL_NAMES).toContain('book_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_conflicts');\n    expect(CALENDAR_TOOL_NAMES).toContain('reschedule_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('cancel_appointment');\n  });\n\n  it('exports CALENDAR_INTENT_PATTERNS for AI guidance', async () => {\n    const { CALENDAR_INTENT_PATTERNS } = await import('../../../prompts/tool-definitions');\n    expect(CALENDAR_INTENT_PATTERNS).toBeDefined();\n    expect(CALENDAR_INTENT_PATTERNS.check_availability).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.book_appointment).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.find_next_available).toBeInstanceOf(Array);\n  });\n\n  it('buildCalendarTools includes check_conflicts tool', async () => {\n    const { buildCalendarTools } = await import('../../../prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const conflictTool = tools.find(t => t.function.name === 'check_conflicts');\n    expect(conflictTool).toBeDefined();\n    expect(conflictTool?.function.parameters.required).toContain('date');\n    expect(conflictTool?.function.parameters.required).toContain('time');\n  });\n\n  it('book_appointment tool has enhanced parameter descriptions', async () => {\n    const { buildCalendarTools } = await import('../../../prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const bookTool = tools.find(t => t.function.name === 'book_appointment');\n    expect(bookTool).toBeDefined();\n\n    const params = bookTool?.function.parameters.properties;\n    expect(params?.attendees).toBeDefined();\n    expect(params?.notes).toBeDefined();\n    expect(params?.time.description).toContain('halb drei');\n  });\n});",
  "new_string": "describe('Tool Definitions Integration', () => {\n  it('exports CALENDAR_TOOL_NAMES including new check_conflicts', async () => {\n    const { CALENDAR_TOOL_NAMES } = await import('@/lib/prompts/tool-definitions');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_availability');\n    expect(CALENDAR_TOOL_NAMES).toContain('book_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_conflicts');\n    expect(CALENDAR_TOOL_NAMES).toContain('reschedule_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('cancel_appointment');\n  });\n\n  it('exports CALENDAR_INTENT_PATTERNS for AI guidance', async () => {\n    const { CALENDAR_INTENT_PATTERNS } = await import('@/lib/prompts/tool-definitions');\n    expect(CALENDAR_INTENT_PATTERNS).toBeDefined();\n    expect(CALENDAR_INTENT_PATTERNS.check_availability).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.book_appointment).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.find_next_available).toBeInstanceOf(Array);\n  });\n\n  it('buildCalendarTools includes check_conflicts tool', async () => {\n    const { buildCalendarTools } = await import('@/lib/prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const conflictTool = tools.find(t => t.function.name === 'check_conflicts');\n    expect(conflictTool).toBeDefined();\n    expect(conflictTool?.function.parameters.required).toContain('date');\n    expect(conflictTool?.function.parameters.required).toContain('time');\n  });\n\n  it('book_appointment tool has enhanced parameter descriptions', async () => {\n    const { buildCalendarTools } = await import('@/lib/prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const bookTool = tools.find(t => t.function.name === 'book_appointment');\n    expect(bookTool).toBeDefined();\n\n    const params = bookTool?.function.parameters.properties;\n    expect(params?.attendees).toBeDefined();\n    expect(params?.notes).toBeDefined();\n    expect(params?.time.description).toContain('halb drei');\n  });\n});"
}

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test -- src/lib/google/__tests__/calendar-enhancements.test.ts 2>&1",
  "description": "Run verification tests again",
  "timeout": 120000
}

The path aliasing is not working for Vitest. Let me fix the import with a proper relative path:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\google\\__tests__\\calendar-enhancements.test.ts",
  "old_string": "describe('Tool Definitions Integration', () => {\n  it('exports CALENDAR_TOOL_NAMES including new check_conflicts', async () => {\n    const { CALENDAR_TOOL_NAMES } = await import('@/lib/prompts/tool-definitions');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_availability');\n    expect(CALENDAR_TOOL_NAMES).toContain('book_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_conflicts');\n    expect(CALENDAR_TOOL_NAMES).toContain('reschedule_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('cancel_appointment');\n  });\n\n  it('exports CALENDAR_INTENT_PATTERNS for AI guidance', async () => {\n    const { CALENDAR_INTENT_PATTERNS } = await import('@/lib/prompts/tool-definitions');\n    expect(CALENDAR_INTENT_PATTERNS).toBeDefined();\n    expect(CALENDAR_INTENT_PATTERNS.check_availability).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.book_appointment).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.find_next_available).toBeInstanceOf(Array);\n  });\n\n  it('buildCalendarTools includes check_conflicts tool', async () => {\n    const { buildCalendarTools } = await import('@/lib/prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const conflictTool = tools.find(t => t.function.name === 'check_conflicts');\n    expect(conflictTool).toBeDefined();\n    expect(conflictTool?.function.parameters.required).toContain('date');\n    expect(conflictTool?.function.parameters.required).toContain('time');\n  });\n\n  it('book_appointment tool has enhanced parameter descriptions', async () => {\n    const { buildCalendarTools } = await import('@/lib/prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const bookTool = tools.find(t => t.function.name === 'book_appointment');\n    expect(bookTool).toBeDefined();\n\n    const params = bookTool?.function.parameters.properties;\n    expect(params?.attendees).toBeDefined();\n    expect(params?.notes).toBeDefined();\n    expect(params?.time.description).toContain('halb drei');\n  });\n});",
  "new_string": "describe('Tool Definitions Integration', () => {\n  it('exports CALENDAR_TOOL_NAMES including new check_conflicts', async () => {\n    const { CALENDAR_TOOL_NAMES } = await import('../../prompts/tool-definitions');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_availability');\n    expect(CALENDAR_TOOL_NAMES).toContain('book_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('check_conflicts');\n    expect(CALENDAR_TOOL_NAMES).toContain('reschedule_appointment');\n    expect(CALENDAR_TOOL_NAMES).toContain('cancel_appointment');\n  });\n\n  it('exports CALENDAR_INTENT_PATTERNS for AI guidance', async () => {\n    const { CALENDAR_INTENT_PATTERNS } = await import('../../prompts/tool-definitions');\n    expect(CALENDAR_INTENT_PATTERNS).toBeDefined();\n    expect(CALENDAR_INTENT_PATTERNS.check_availability).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.book_appointment).toBeInstanceOf(Array);\n    expect(CALENDAR_INTENT_PATTERNS.find_next_available).toBeInstanceOf(Array);\n  });\n\n  it('buildCalendarTools includes check_conflicts tool', async () => {\n    const { buildCalendarTools } = await import('../../prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const conflictTool = tools.find(t => t.function.name === 'check_conflicts');\n    expect(conflictTool).toBeDefined();\n    expect(conflictTool?.function.parameters.required).toContain('date');\n    expect(conflictTool?.function.parameters.required).toContain('time');\n  });\n\n  it('book_appointment tool has enhanced parameter descriptions', async () => {\n    const { buildCalendarTools } = await import('../../prompts/tool-definitions');\n    const tools = buildCalendarTools('https://example.com');\n\n    const bookTool = tools.find(t => t.function.name === 'book_appointment');\n    expect(bookTool).toBeDefined();\n\n    const params = bookTool?.function.parameters.properties;\n    expect(params?.attendees).toBeDefined();\n    expect(params?.notes).toBeDefined();\n    expect(params?.time.description).toContain('halb drei');\n  });\n});"
}

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test -- src/lib/google/__tests__/calendar-enhancements.test.ts 2>&1",
  "description": "Run verification tests with fixed imports",
  "timeout": 120000
}

All 31 tests pass. Now let me also run all tests to make sure the changes don't break existing functionality:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test 2>&1",
  "description": "Run all tests",
  "timeout": 180000
}

All 85 tests pass. Now let me also ensure the TypeScript compiles without errors:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npx tsc --noEmit 2>&1 | head -50",
  "description": "Check TypeScript compilation",
  "timeout": 120000
}

TypeScript compiles without errors. Now let me delete the verification test file as required, and update the todo list:

🔧 Tool: Bash
Input: {
  "command": "rm F:/CodeBase/Kametrix/src/lib/google/__tests__/calendar-enhancements.test.ts",
  "description": "Delete verification test file"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Enhance intent recognition for calendar requests in tool definitions",
      "status": "completed",
      "activeForm": "Enhancing intent recognition for calendar requests"
    },
    {
      "content": "Improve parameter extraction for dates, times, and attendees",
      "status": "completed",
      "activeForm": "Improving parameter extraction for dates, times, and attendees"
    },
    {
      "content": "Add conflict detection when booking appointments",
      "status": "completed",
      "activeForm": "Adding conflict detection when booking appointments"
    },
    {
      "content": "Enhance conversational responses for calendar actions",
      "status": "completed",
      "activeForm": "Enhancing conversational responses for calendar actions"
    },
    {
      "content": "Update system prompts with better calendar instructions",
      "status": "completed",
      "activeForm": "Updating system prompts with better calendar instructions"
    },
    {
      "content": "Create Playwright verification test",
      "status": "completed",
      "activeForm": "Creating Playwright verification test"
    },
    {
      "content": "Run verification test and delete test file",
      "status": "completed",
      "activeForm": "Running verification test and deleting test file"
    }
  ]
}

All tasks are complete. Let me verify the test file was deleted and run the existing tests one more time to ensure everything still works:

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && ls -la src/lib/google/__tests__/",
  "description": "Verify test file deleted"
}

🔧 Tool: Bash
Input: {
  "command": "cd F:/CodeBase/Kametrix && npm run test 2>&1",
  "description": "Run all tests after cleanup",
  "timeout": 180000
}

All existing tests continue to pass (54 tests). The implementation is complete.

<summary>
## Summary: Improve AI Voice Agent Google Calendar Operations

### Changes Implemented

1. **Enhanced Intent Recognition (tool-definitions.ts)**
   - Added `CALENDAR_INTENT_PATTERNS` constant with common German phrases that map to calendar tools
   - Expanded tool descriptions with typical user phrases and use cases
   - Added new `check_conflicts` tool for pre-booking conflict detection
   - Improved parameter descriptions with extraction hints for the AI (e.g., "halb drei" -> "14:30")

2. **Improved Parameter Extraction (calendar.ts)**
   - Added `parseTimeInput()` function for German natural language time expressions:
     - "halb drei" -> 14:30 (German half-to pattern)
     - "viertel nach zehn" -> 10:15
     - "viertel vor elf" -> 10:45
     - "X Uhr nachmittags" -> PM conversion
     - German number words (eins, zwei, drei, etc.)
   - Enhanced `parseDateInput()` with:
     - Week-based expressions ("in 3 wochen", "naechste woche")
     - "jetzt" (now) support
     - "diese woche" / "next week" parsing
   - Added `TIME_RANGES` constant for time-of-day preferences (morgens, nachmittags, etc.)
   - Added `filterSlotsByTimeRange()` for filtering availability by preferred time

3. **Conflict Detection (calendar.ts + route.ts)**
   - Added `checkConflicts()` function that:
     - Checks if requested time slot conflicts with existing events
     - Returns details about conflicting events
     - Automatically suggests up to 3 alternative time slots
     - Provides German human-readable messages for the voice assistant
   - Added `check_conflicts` webhook handler in the Vapi route

4. **Enhanced Conversational Responses (route.ts)**
   - Improved booking confirmations with more details (email invitations, location)
   - Better error handling with specific messages for different error types (conflict, auth expired, not found)
   - Enhanced reschedule handler with conflict pre-check
   - Better cancel handler with date-specific messaging
   - Improved availability check with time range filtering and next-available fallback

5. **Updated System Prompts (template-builder.ts)**
   - Expanded calendar instructions with all 8 available tools
   - Added German time expression guide ("halb drei" = 14:30, NOT 14:00!)
   - Added conflict handling instructions
   - Enhanced booking process with confirmation requirements
   - Added date/time processing rules for the AI

### Files Modified
- `src/lib/prompts/tool-definitions.ts` - Enhanced tool definitions and intent patterns
- `src/lib/google/calendar.ts` - New time/date parsing, conflict detection, time range filtering
- `src/app/api/webhooks/vapi/route.ts` - Enhanced webhook handlers with better responses
- `src/lib/prompts/template-builder.ts` - Improved calendar section in system prompts

### Verification Status
- Created comprehensive verification test with 31 test cases
- All 31 tests passed covering:
  - Date parsing (heute, morgen, weekdays, weeks)
  - Time parsing (halb, viertel, Uhr patterns)
  - Time range definitions and filtering
  - Tool definitions integration
  - Conflict detection interface
- All existing 54 tests continue to pass
- TypeScript compilation successful
- Verification test file deleted after successful verification

### Notes for Developer
- The `parseTimeInput()` function defaults small hours (1-7) to afternoon when context is ambiguous, which is appropriate for business appointment booking
- The conflict detection automatically provides German-language responses suitable for the voice assistant
- The `CALENDAR_INTENT_PATTERNS` can be used in the future for additional AI guidance or analytics
- The time range filtering supports both German and English terms (morgens/morning, nachmittags/afternoon)
</summary>