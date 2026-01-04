/**
 * Test script to verify enhanced prompt generation
 * Run with: node test-prompt.js
 */

const { buildSystemPrompt, buildSystemPromptWithMetadata } = require('./src/lib/prompts/system-prompt');

// Test configuration
const testConfig = {
  businessName: "Bella Italia Pizzeria",
  businessDescription: "Italienisches Restaurant mit Pizzaservice und Lieferung",
  greeting: "Guten Tag! Hier ist Bella Italia. Wie kann ich Ihnen helfen?",
  faqs: [
    { question: "Liefern Sie auch?", answer: "Ja, wir liefern im Umkreis von 5km." },
    { question: "Haben Sie auch vegane Pizza?", answer: "Ja, wir haben mehrere vegane Optionen." }
  ],
  calendarEnabled: false
};

console.log('=== Testing Enhanced Prompt System ===\n');

// Test basic prompt generation
console.log('1. Basic Prompt Generation:');
const basicPrompt = buildSystemPrompt(testConfig);
console.log(`Generated ${basicPrompt.length} characters`);
console.log('First 200 chars:', basicPrompt.substring(0, 200) + '...\n');

// Test enhanced prompt with metadata
console.log('2. Enhanced Prompt with Metadata:');
const enhancedResult = buildSystemPromptWithMetadata(testConfig);
console.log(`Detected Business Type: ${enhancedResult.detectedBusinessType}`);
console.log(`Number of Sections: ${enhancedResult.sections.length}`);
console.log(`Variables Used: ${enhancedResult.variablesUsed.join(', ')}`);
console.log('\nSections:');
enhancedResult.sections.forEach(section => {
  console.log(`  - ${section.type} (priority: ${section.priority}, enabled: ${section.enabled})`);
});

console.log('\n=== Test Complete ===');
