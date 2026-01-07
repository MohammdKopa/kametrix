'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Rocket,
  Calendar,
  Bot,
  Wallet,
  Wrench,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQ_DATA, FAQ_CATEGORIES, type FAQCategory } from '@/lib/onboarding/faq-data';

const CATEGORY_ICONS: Record<FAQCategory, React.ComponentType<{ className?: string }>> = {
  'getting-started': Rocket,
  calendar: Calendar,
  'voice-agent': Bot,
  billing: Wallet,
  troubleshooting: Wrench,
};

interface FAQAccordionProps {
  className?: string;
  showCategories?: boolean;
  defaultCategory?: FAQCategory | 'all';
  maxItems?: number;
}

export function FAQAccordion({
  className,
  showCategories = true,
  defaultCategory = 'all',
  maxItems,
}: FAQAccordionProps) {
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'all'>(defaultCategory);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).slice(0, maxItems);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="FAQ durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category tabs */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Alle
          </button>
          {FAQ_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5',
                  activeCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Icon className="h-3 w-3" />
                {category.label}
              </button>
            );
          })}
        </div>
      )}

      {/* FAQ items */}
      <div className="space-y-2">
        {filteredFAQs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Keine Ergebnisse gefunden
          </p>
        ) : (
          filteredFAQs.map((faq) => (
            <FAQItem
              key={faq.id}
              id={faq.id}
              question={faq.question}
              answer={faq.answer}
              isExpanded={expandedId === faq.id}
              onToggle={() => toggleExpanded(faq.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({ id, question, answer, isExpanded, onToggle }: FAQItemProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card overflow-hidden transition-all',
        isExpanded && 'ring-1 ring-primary/20'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`faq-answer-${id}`}
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`faq-answer-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground border-t pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for sidebar/help panel
export function FAQCompact({ category, maxItems = 3 }: { category?: FAQCategory; maxItems?: number }) {
  const faqs = category
    ? FAQ_DATA.filter(faq => faq.category === category).slice(0, maxItems)
    : FAQ_DATA.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {faqs.map((faq) => (
        <details key={faq.id} className="group">
          <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary transition-colors list-none flex items-center gap-2">
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
            {faq.question}
          </summary>
          <p className="mt-2 ml-5 text-xs text-muted-foreground">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
