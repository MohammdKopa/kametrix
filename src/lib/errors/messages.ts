/**
 * User-Friendly Error Messages
 *
 * Multi-language error message mapping for displaying to users.
 * Currently supports English (en) and German (de).
 */

import { ErrorCode } from './types';

type Language = 'en' | 'de';

/**
 * User-friendly error messages by code and language
 */
const errorMessages: Record<ErrorCode, Record<Language, string>> = {
  // Validation errors
  [ErrorCode.VALIDATION_FAILED]: {
    en: 'The provided data is invalid. Please check your input and try again.',
    de: 'Die angegebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingabe.',
  },
  [ErrorCode.INVALID_INPUT]: {
    en: 'Invalid input provided. Please check and try again.',
    de: 'Ungültige Eingabe. Bitte überprüfen und erneut versuchen.',
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    en: 'Required information is missing. Please fill in all required fields.',
    de: 'Erforderliche Informationen fehlen. Bitte füllen Sie alle Pflichtfelder aus.',
  },
  [ErrorCode.INVALID_FORMAT]: {
    en: 'The format of your input is incorrect. Please check and try again.',
    de: 'Das Format Ihrer Eingabe ist falsch. Bitte überprüfen und erneut versuchen.',
  },
  [ErrorCode.VALUE_OUT_OF_RANGE]: {
    en: 'The provided value is out of the acceptable range.',
    de: 'Der angegebene Wert liegt außerhalb des zulässigen Bereichs.',
  },

  // Authentication errors
  [ErrorCode.AUTH_REQUIRED]: {
    en: 'Please log in to continue.',
    de: 'Bitte melden Sie sich an, um fortzufahren.',
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    en: 'Invalid email or password. Please try again.',
    de: 'Ungültige E-Mail oder Passwort. Bitte versuchen Sie es erneut.',
  },
  [ErrorCode.SESSION_EXPIRED]: {
    en: 'Your session has expired. Please log in again.',
    de: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
  },
  [ErrorCode.INVALID_TOKEN]: {
    en: 'Invalid or expired token. Please log in again.',
    de: 'Ungültiger oder abgelaufener Token. Bitte melden Sie sich erneut an.',
  },
  [ErrorCode.ACCOUNT_LOCKED]: {
    en: 'Your account has been locked. Please contact support.',
    de: 'Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.',
  },
  [ErrorCode.INVALID_SESSION]: {
    en: 'Invalid session. Please log in again.',
    de: 'Ungültige Sitzung. Bitte melden Sie sich erneut an.',
  },

  // Authorization errors
  [ErrorCode.FORBIDDEN]: {
    en: "You don't have permission to access this resource.",
    de: 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.',
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    en: "You don't have sufficient permissions for this action.",
    de: 'Sie haben nicht ausreichend Berechtigungen für diese Aktion.',
  },
  [ErrorCode.ADMIN_REQUIRED]: {
    en: 'Administrator privileges are required for this action.',
    de: 'Für diese Aktion sind Administratorrechte erforderlich.',
  },
  [ErrorCode.RESOURCE_ACCESS_DENIED]: {
    en: 'Access to this resource has been denied.',
    de: 'Der Zugriff auf diese Ressource wurde verweigert.',
  },

  // Not found errors
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    en: 'The requested resource could not be found.',
    de: 'Die angeforderte Ressource wurde nicht gefunden.',
  },
  [ErrorCode.USER_NOT_FOUND]: {
    en: 'User not found.',
    de: 'Benutzer nicht gefunden.',
  },
  [ErrorCode.AGENT_NOT_FOUND]: {
    en: 'Agent not found.',
    de: 'Agent nicht gefunden.',
  },
  [ErrorCode.CALL_NOT_FOUND]: {
    en: 'Call not found.',
    de: 'Anruf nicht gefunden.',
  },
  [ErrorCode.ENDPOINT_NOT_FOUND]: {
    en: 'The requested endpoint does not exist.',
    de: 'Der angeforderte Endpunkt existiert nicht.',
  },

  // Conflict errors
  [ErrorCode.RESOURCE_CONFLICT]: {
    en: 'A conflict occurred. The resource may have been modified by another process.',
    de: 'Ein Konflikt ist aufgetreten. Die Ressource wurde möglicherweise von einem anderen Prozess geändert.',
  },
  [ErrorCode.DUPLICATE_ENTRY]: {
    en: 'This entry already exists.',
    de: 'Dieser Eintrag existiert bereits.',
  },
  [ErrorCode.CONCURRENT_MODIFICATION]: {
    en: 'The resource was modified by another process. Please refresh and try again.',
    de: 'Die Ressource wurde von einem anderen Prozess geändert. Bitte aktualisieren und erneut versuchen.',
  },
  [ErrorCode.CALENDAR_CONFLICT]: {
    en: 'There is a scheduling conflict. Please choose a different time.',
    de: 'Es gibt einen Terminkonflikt. Bitte wählen Sie eine andere Zeit.',
  },

  // Rate limit errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    en: 'Too many requests. Please wait a moment and try again.',
    de: 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    en: 'Your quota has been exceeded. Please upgrade your plan or wait for the quota to reset.',
    de: 'Ihr Kontingent wurde überschritten. Bitte upgraden Sie Ihren Plan oder warten Sie auf die Zurücksetzung.',
  },
  [ErrorCode.TOO_MANY_REQUESTS]: {
    en: 'You are making too many requests. Please slow down.',
    de: 'Sie stellen zu viele Anfragen. Bitte verlangsamen Sie.',
  },

  // External service errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    en: 'An external service is currently unavailable. Please try again later.',
    de: 'Ein externer Dienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.VAPI_ERROR]: {
    en: 'The voice service is currently experiencing issues. Please try again later.',
    de: 'Der Sprachdienst hat derzeit Probleme. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.GOOGLE_API_ERROR]: {
    en: 'Google services are currently unavailable. Please try again later.',
    de: 'Google-Dienste sind derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.STRIPE_ERROR]: {
    en: 'Payment processing is currently unavailable. Please try again later.',
    de: 'Die Zahlungsverarbeitung ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.EMAIL_SERVICE_ERROR]: {
    en: 'Email service is currently unavailable. Please try again later.',
    de: 'Der E-Mail-Dienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    en: 'Service is temporarily unavailable. Please try again later.',
    de: 'Der Dienst ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.SERVICE_TIMEOUT]: {
    en: 'The request took too long to complete. Please try again.',
    de: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.',
  },
  [ErrorCode.OPENROUTER_ERROR]: {
    en: 'AI service is currently unavailable. Please try again later.',
    de: 'Der KI-Dienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
  },

  // Database errors
  [ErrorCode.DATABASE_ERROR]: {
    en: 'A database error occurred. Please try again later.',
    de: 'Ein Datenbankfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.CONNECTION_FAILED]: {
    en: 'Could not connect to the database. Please try again later.',
    de: 'Verbindung zur Datenbank konnte nicht hergestellt werden. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.QUERY_FAILED]: {
    en: 'Database query failed. Please try again later.',
    de: 'Datenbankabfrage fehlgeschlagen. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.TRANSACTION_FAILED]: {
    en: 'Database transaction failed. Please try again.',
    de: 'Datenbanktransaktion fehlgeschlagen. Bitte versuchen Sie es erneut.',
  },
  [ErrorCode.CONSTRAINT_VIOLATION]: {
    en: 'The operation violated a database constraint.',
    de: 'Die Operation hat eine Datenbankbeschränkung verletzt.',
  },

  // Internal errors
  [ErrorCode.INTERNAL_ERROR]: {
    en: 'An unexpected error occurred. Please try again later.',
    de: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.CONFIGURATION_ERROR]: {
    en: 'A configuration error occurred. Please contact support.',
    de: 'Ein Konfigurationsfehler ist aufgetreten. Bitte kontaktieren Sie den Support.',
  },
  [ErrorCode.UNEXPECTED_ERROR]: {
    en: 'Something went wrong. Please try again later.',
    de: 'Etwas ist schief gelaufen. Bitte versuchen Sie es später erneut.',
  },
  [ErrorCode.INITIALIZATION_FAILED]: {
    en: 'Service initialization failed. Please try again later.',
    de: 'Die Dienstinitialisierung ist fehlgeschlagen. Bitte versuchen Sie es später erneut.',
  },

  // Network errors
  [ErrorCode.NETWORK_ERROR]: {
    en: 'A network error occurred. Please check your connection and try again.',
    de: 'Ein Netzwerkfehler ist aufgetreten. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  },
  [ErrorCode.CONNECTION_TIMEOUT]: {
    en: 'Connection timed out. Please check your network and try again.',
    de: 'Verbindungszeitüberschreitung. Bitte überprüfen Sie Ihr Netzwerk und versuchen Sie es erneut.',
  },
  [ErrorCode.DNS_RESOLUTION_FAILED]: {
    en: 'Could not resolve the server address. Please try again later.',
    de: 'Die Serveradresse konnte nicht aufgelöst werden. Bitte versuchen Sie es später erneut.',
  },
};

/**
 * Get user-friendly error message
 */
export function getUserMessage(
  code: ErrorCode,
  language: Language = 'en'
): string {
  const messages = errorMessages[code];
  if (!messages) {
    return language === 'de'
      ? 'Ein unerwarteter Fehler ist aufgetreten.'
      : 'An unexpected error occurred.';
  }
  return messages[language] ?? messages['en'];
}

/**
 * Get message with placeholder substitution
 */
export function getUserMessageWithParams(
  code: ErrorCode,
  params: Record<string, string>,
  language: Language = 'en'
): string {
  let message = getUserMessage(code, language);

  for (const [key, value] of Object.entries(params)) {
    message = message.replace(`{${key}}`, value);
  }

  return message;
}

/**
 * Voice-friendly error messages for Vapi
 * These are simplified messages suitable for voice output
 */
export const voiceErrorMessages: Record<ErrorCode, Record<Language, string>> = {
  [ErrorCode.CALENDAR_CONFLICT]: {
    en: 'That time slot is not available. Would you like to try a different time?',
    de: 'Dieser Termin ist leider nicht verfügbar. Möchten Sie eine andere Zeit versuchen?',
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    en: 'Please wait a moment before trying again.',
    de: 'Bitte warten Sie einen Moment, bevor Sie es erneut versuchen.',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    en: 'I am having trouble processing your request right now. Please try again in a moment.',
    de: 'Ich habe gerade Schwierigkeiten, Ihre Anfrage zu verarbeiten. Bitte versuchen Sie es in einem Moment erneut.',
  },
  [ErrorCode.VALIDATION_FAILED]: {
    en: 'I did not understand that. Could you please repeat?',
    de: 'Das habe ich nicht verstanden. Könnten Sie das bitte wiederholen?',
  },
  [ErrorCode.GOOGLE_API_ERROR]: {
    en: 'I am having trouble accessing the calendar right now. Please try again later.',
    de: 'Ich habe gerade Schwierigkeiten, auf den Kalender zuzugreifen. Bitte versuchen Sie es später erneut.',
  },
} as Record<ErrorCode, Record<Language, string>>;

/**
 * Get voice-friendly error message
 */
export function getVoiceMessage(
  code: ErrorCode,
  language: Language = 'en'
): string {
  const messages = voiceErrorMessages[code];
  if (!messages) {
    return language === 'de'
      ? 'Entschuldigung, da ist etwas schief gelaufen. Bitte versuchen Sie es erneut.'
      : 'Sorry, something went wrong. Please try again.';
  }
  return messages[language] ?? messages['en'];
}
