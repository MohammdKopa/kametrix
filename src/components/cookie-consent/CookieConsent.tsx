"use client";

import { useEffect } from "react";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { cookieConsentConfig } from "./config";

export function CookieConsentBanner() {
  useEffect(() => {
    CookieConsent.run(cookieConsentConfig);
  }, []);

  return null; // UI is rendered by the library
}
