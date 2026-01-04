/**
 * Test script for enhanced prompt generation system
 *
 * Run with: npx tsx scripts/test-enhanced-prompts.ts
 */

import { buildSystemPrompt, buildSystemPromptWithMetadata, getBusinessType } from '../src/lib/prompts';
import type { PromptConfig } from '../src/lib/prompts/types';

const testConfigs: { name: string; config: PromptConfig }[] = [
  {
    name: 'Italian Restaurant',
    config: {
      businessName: 'Bella Italia Pizzeria',
      businessDescription: 'Italienisches Restaurant mit Pizza-Lieferservice',
      greeting: 'Guten Tag! Hier ist Bella Italia. Wie kann ich Ihnen helfen?',
      faqs: [
        { question: 'Liefern Sie auch?', answer: 'Ja, im Umkreis von 5km kostenlos.' },
        { question: 'Haben Sie vegane Optionen?', answer: 'Ja, wir haben vegane Pizza und Pasta.' }
      ],
      calendarEnabled: false
    }
  },
  {
    name: 'Hair Salon',
    config: {
      businessName: 'Salon Elegance',
      businessDescription: 'Moderner Friseursalon für Damen und Herren',
      greeting: 'Willkommen bei Salon Elegance!',
      faqs: [
        { question: 'Brauche ich einen Termin?', answer: 'Termine werden empfohlen, Walk-ins sind aber auch möglich.' }
      ],
      calendarEnabled: true
    }
  },
  {
    name: 'Medical Practice',
    config: {
      businessName: 'Praxis Dr. Schmidt',
      businessDescription: 'Hausarztpraxis mit allgemeinmedizinischer Versorgung',
      greeting: 'Guten Tag, Praxis Dr. Schmidt.',
      faqs: [
        { question: 'Nehmen Sie neue Patienten auf?', answer: 'Ja, wir nehmen neue Patienten auf.' }
      ],
      calendarEnabled: true
    }
  }
];

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         Enhanced Prompt Generation System Test                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

testConfigs.forEach(({ name, config }) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));

  // Test business type detection
  const detectedType = getBusinessType(config);
  console.log(`\n✓ Detected Business Type: ${detectedType}`);

  // Test enhanced prompt generation
  const result = buildSystemPromptWithMetadata(config);
  console.log(`✓ Prompt Length: ${result.prompt.length} characters`);
  console.log(`✓ Sections Generated: ${result.sections.length}`);
  console.log(`✓ Variables Used: ${result.variablesUsed.join(', ') || 'none'}`);

  console.log('\nSections:');
  result.sections.forEach(section => {
    const status = section.enabled ? '✓' : '○';
    console.log(`  ${status} ${section.type.padEnd(20)} (priority: ${section.priority})`);
  });

  // Show a snippet of the generated prompt
  console.log('\nPrompt Preview (first 300 chars):');
  console.log('─'.repeat(60));
  console.log(result.prompt.substring(0, 300) + '...');
  console.log('─'.repeat(60));
});

console.log('\n\n✅ All tests completed successfully!\n');
