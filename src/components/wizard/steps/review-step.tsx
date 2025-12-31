'use client';

import { Edit2 } from 'lucide-react';
import type { WizardState } from '@/types/wizard';

interface ReviewStepProps {
  data: WizardState;
  onEdit: (step: number) => void;
}

export function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const completedFaqs = data.knowledge.faqs.filter(
    (faq) => faq.question.trim() && faq.answer.trim()
  );

  const voiceProviderName = 'ElevenLabs';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Übersicht & Erstellen</h2>
        <p className="text-sm text-gray-600">
          Prüfen Sie die Konfiguration Ihres Assistenten bevor Sie ihn erstellen.
        </p>
      </div>

      {/* Business Information */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-900">Ihr Unternehmen</h3>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Edit2 className="w-3 h-3" />
            Bearbeiten
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Unternehmensname:</dt>
            <dd className="text-gray-600">{data.businessInfo.businessName || '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Beschreibung:</dt>
            <dd className="text-gray-600">{data.businessInfo.businessDescription || '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Öffnungszeiten:</dt>
            <dd className="text-gray-600">{data.businessInfo.businessHours || '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Dienstleistungen:</dt>
            <dd className="text-gray-600">
              {data.businessInfo.services.length > 0 ? (
                <ul className="list-disc list-inside">
                  {data.businessInfo.services.map((service, index) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              ) : (
                '-'
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Knowledge Base */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-900">Wissen & FAQs</h3>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Edit2 className="w-3 h-3" />
            Bearbeiten
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Häufige Fragen:</dt>
            <dd className="text-gray-600">
              {completedFaqs.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {completedFaqs.map((faq, index) => (
                    <div key={index} className="pl-3 border-l-2 border-gray-300">
                      <p className="font-medium text-gray-700">F: {faq.question}</p>
                      <p className="text-gray-600">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                'Keine FAQs hinzugefügt'
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Richtlinien:</dt>
            <dd className="text-gray-600 whitespace-pre-line">
              {data.knowledge.policies || 'Keine Richtlinien hinzugefügt'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Voice Configuration */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-900">Stimme</h3>
          <button
            type="button"
            onClick={() => onEdit(3)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Edit2 className="w-3 h-3" />
            Bearbeiten
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Anbieter:</dt>
            <dd className="text-gray-600">{voiceProviderName}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Stimme:</dt>
            <dd className="text-gray-600">{data.voice.voiceId}</dd>
          </div>
        </dl>
      </div>

      {/* Greeting & Messages */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-900">Begrüßung & Verabschiedung</h3>
          <button
            type="button"
            onClick={() => onEdit(4)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Edit2 className="w-3 h-3" />
            Bearbeiten
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Name des Assistenten:</dt>
            <dd className="text-gray-600">{data.greeting.agentName || '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Begrüßung:</dt>
            <dd className="text-gray-600 italic">
              &ldquo;{data.greeting.greeting || '-'}&rdquo;
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Verabschiedung:</dt>
            <dd className="text-gray-600 italic">
              &ldquo;{data.greeting.endCallMessage || '-'}&rdquo;
            </dd>
          </div>
        </dl>
      </div>

      {/* Ready to Create */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>Bereit zur Erstellung!</strong> Klicken Sie auf &ldquo;Assistent erstellen&rdquo; um Ihren KI-Sprachassistenten zu generieren.
          Es wird sowohl der Datenbankeintrag als auch die Vapi-Konfiguration erstellt.
        </p>
      </div>
    </div>
  );
}
