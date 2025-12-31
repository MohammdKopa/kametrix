'use client';

import { Plus, X } from 'lucide-react';
import type { WizardState } from '@/types/wizard';

interface BusinessInfoStepProps {
  data: WizardState['businessInfo'];
  onChange: (data: Partial<WizardState['businessInfo']>) => void;
}

export function BusinessInfoStep({ data, onChange }: BusinessInfoStepProps) {
  const addService = () => {
    onChange({ services: [...data.services, ''] });
  };

  const removeService = (index: number) => {
    onChange({ services: data.services.filter((_, i) => i !== index) });
  };

  const updateService = (index: number, value: string) => {
    const newServices = [...data.services];
    newServices[index] = value;
    onChange({ services: newServices });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ueber Ihr Unternehmen</h2>
        <p className="text-sm text-gray-600">
          Erzaehlen Sie uns von Ihrem Unternehmen, damit Ihr KI-Assistent Sie bestmoeglich repraesentieren kann.
        </p>
      </div>

      {/* Business Name */}
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
          Name Ihres Unternehmens <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="businessName"
          value={data.businessName}
          onChange={(e) => onChange({ businessName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Friseur Schmidt"
        />
        <p className="mt-1 text-xs text-gray-500">
          So wird Ihr Assistent Ihr Unternehmen am Telefon vorstellen.
        </p>
      </div>

      {/* Business Description */}
      <div>
        <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="businessDescription"
          value={data.businessDescription}
          onChange={(e) => onChange({ businessDescription: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Wir sind ein moderner Friseursalon im Herzen der Stadt mit Fokus auf individuelle Beratung..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Je genauer Sie beschreiben, desto besser kann Ihr Assistent Fragen beantworten.
        </p>
      </div>

      {/* Business Hours */}
      <div>
        <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700 mb-1">
          Oeffnungszeiten <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="businessHours"
          value={data.businessHours}
          onChange={(e) => onChange({ businessHours: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="z.B. Mo-Fr 9-18 Uhr, Sa 9-14 Uhr"
        />
        <p className="mt-1 text-xs text-gray-500">
          Diese Information wird bei Anfragen zu Ihren Oeffnungszeiten verwendet.
        </p>
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ihre Dienstleistungen <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Fuegen Sie die wichtigsten Angebote Ihres Unternehmens hinzu.
        </p>

        <div className="space-y-2">
          {data.services.map((service, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={service}
                onChange={(e) => updateService(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Dienstleistung ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeService(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 border border-gray-300 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addService}
          className="mt-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-md"
        >
          <Plus className="w-4 h-4" />
          Dienstleistung hinzufuegen
        </button>
      </div>
    </div>
  );
}
