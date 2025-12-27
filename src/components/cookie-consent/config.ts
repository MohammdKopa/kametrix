import type { CookieConsentConfig } from "vanilla-cookieconsent";

export const cookieConsentConfig: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom left",
      equalWeightButtons: true, // GDPR: Accept/Reject equally prominent
    },
  },
  categories: {
    necessary: {
      enabled: true,
      readOnly: true, // Cannot be disabled
    },
    analytics: {
      autoClear: {
        cookies: [{ name: /^_ga/ }, { name: "_gid" }],
      },
    },
  },
  language: {
    default: "de",
    translations: {
      de: {
        consentModal: {
          title: "Wir verwenden Cookies",
          description:
            "Wir nutzen Cookies, um Ihre Erfahrung zu verbessern und unsere Website zu analysieren. Sie können Ihre Einstellungen jederzeit ändern.",
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          showPreferencesBtn: "Einstellungen verwalten",
          footer: `
            <a href="/impressum">Impressum</a>
            <a href="/datenschutz">Datenschutz</a>
          `,
        },
        preferencesModal: {
          title: "Cookie-Einstellungen",
          acceptAllBtn: "Alle akzeptieren",
          acceptNecessaryBtn: "Nur notwendige",
          savePreferencesBtn: "Auswahl speichern",
          closeIconLabel: "Schließen",
          sections: [
            {
              title: "Ihre Privatsphäre",
              description:
                "Hier können Sie Ihre Cookie-Einstellungen verwalten.",
            },
            {
              title: "Notwendige Cookies",
              description:
                "Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.",
              linkedCategory: "necessary",
            },
            {
              title: "Analyse-Cookies",
              description:
                "Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen.",
              linkedCategory: "analytics",
            },
          ],
        },
      },
    },
  },
};
