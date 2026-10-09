"use client";

/**
 * KYC step 3: "Proof of Residency": where you live, your nationality,
 * and which ID document you'll verify with.
 *
 *   ← Proof of Residency
 *   Prove you live in Ghana
 *
 *   Country of residence
 *   [ (flag)  Ghana                      🔒 ]   ← fixed: we only operate in Ghana
 *   Feenicks1 is currently available to people living in Ghana.
 *
 *   Nationality
 *   [ (flag)  Ghana                Change ⌄ ]   ← every country; opens the phone's picker
 *
 *   Choose Verification Method                  ← options depend on nationality:
 *   ┌────────────────────────────────────┐        Ghanaian → Ghana Card / Driver's Licence / Passport
 *   │ (🪪)  Ghana Card                 ◉ │        Others   → Passport / Ghana Card (Non-Citizen)
 *   │       National ID (recommended)    │
 *   └────────────────────────────────────┘
 *   │ (🚗)  Driver's Licence           ◯ │
 *   │ (📘)  Passport                   ◯ │
 *   (              Continue              )
 *
 * The business rules (who can join, which ID is accepted) live in
 * identityDocuments.ts, not here.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarIcon, ChevronDownIcon, IdCardIcon, LockIcon, PassportIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass, stepFormClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { ROUTES } from "@/config/routes";
import {
  COUNTRIES,
  IDENTITY_DOCUMENTS,
  RESIDENCE_COUNTRY_CODE,
  getAcceptedDocuments,
  getCountryName,
  type CountryCode,
  type IdentityDocumentId,
} from "./identityDocuments";
import { saveResidency } from "./kycService";
import { useKycStore } from "./useKycStore";

/** Icon shown in each document card. */
const DOCUMENT_ICONS: Record<IdentityDocumentId, React.ReactNode> = {
  "ghana-card": <IdCardIcon />,
  "drivers-licence": <CarIcon />,
  "non-citizen-ghana-card": <IdCardIcon />,
  passport: <PassportIcon />,
};

/** Where "Continue" leads: photographing the chosen ID document. */
const NEXT_SCREEN = ROUTES.kycUploadId;

/** Shared look for the two country rows. */
const countryRowClass =
  "relative mt-2 flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3.5 dark:border-white/10";

const sectionLabelClass = "text-sm font-semibold text-neutral-500";

export function ProofOfResidencyScreen() {
  const router = useRouter();
  const savedNationality = useKycStore((s) => s.nationality);
  const savedDocument = useKycStore((s) => s.identityDocument);
  const saveInStore = useKycStore((s) => s.saveResidency);

  const [nationality, setNationality] = useState<CountryCode>(savedNationality);
  const acceptedDocuments = getAcceptedDocuments(nationality);

  // Start with the saved choice if it's still valid, otherwise the first accepted document.
  const [document, setDocument] = useState<IdentityDocumentId>(
    savedDocument && acceptedDocuments.includes(savedDocument)
      ? savedDocument
      : acceptedDocuments[0],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A different nationality means different accepted documents → pick the first one.
  const changeNationality = (code: CountryCode) => {
    setNationality(code);
    setDocument(getAcceptedDocuments(code)[0]);
  };

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    const result = await saveResidency(nationality, document);
    if (!result.ok) {
      setError(result.message);
      setIsSaving(false);
      return;
    }
    saveInStore(nationality, document);
    router.push(NEXT_SCREEN);
  };

  return (
    <StepScreenLayout
      title="Proof of Residency"
      subtitle="Prove you live in Ghana"
      backHref={ROUTES.kycVerifyIdentity}
    >
      <form onSubmit={handleContinue} noValidate className={stepFormClass}>
        <div className="flex flex-col gap-5">
          {/* ── Country of residence (fixed) ────────────────────────────── */}
          <div>
            <p className={sectionLabelClass}>Country of residence</p>
            <div className={`${countryRowClass} bg-neutral-50 dark:bg-white/5`}>
              <CountryFlag code={RESIDENCE_COUNTRY_CODE} />
              <span className="flex-1 text-[0.9375rem] font-semibold lg:text-sm">
                {getCountryName(RESIDENCE_COUNTRY_CODE)}
              </span>
              <LockIcon className="size-4 text-neutral-500" />
            </div>
            <p className="mt-2 text-[0.8125rem] text-neutral-500">
              Feenicks1 is currently available to people living in Ghana.
            </p>
          </div>

          {/* ── Nationality (any country) ──────────────────────────────── */}
          <div>
            <label htmlFor="nationality" className={sectionLabelClass}>
              Nationality
            </label>
            {/* The real <select> covers the whole row invisibly, so tapping
                anywhere opens the phone's native country picker. */}
            <div
              className={`${countryRowClass} transition-colors focus-within:border-brand-400 hover:border-neutral-300`}
            >
              <CountryFlag code={nationality} />
              {/* Country names come from built-in browser data, which can
                  differ slightly from the server's; that's expected. */}
              <span
                suppressHydrationWarning
                className="flex-1 truncate text-[0.9375rem] font-semibold lg:text-sm"
              >
                {getCountryName(nationality)}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">
                Change
                <ChevronDownIcon className="size-4" />
              </span>
              <select
                id="nationality"
                value={nationality}
                onChange={(e) => changeNationality(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code} suppressHydrationWarning>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Verification method (depends on nationality) ──────────── */}
          <fieldset>
            <legend className={sectionLabelClass}>Choose Verification Method</legend>

            <div className="mt-2 flex flex-col gap-3">
              {acceptedDocuments.map((id) => {
                const option = IDENTITY_DOCUMENTS[id];
                const isSelected = document === id;
                return (
                  <label
                    key={id}
                    // Flat card: hairline border, green when selected. No shadows.
                    className="flex cursor-pointer items-center gap-4 rounded-2xl border border-neutral-200 px-4 py-3.5 transition-colors hover:border-neutral-300 has-checked:border-brand-600 has-focus-visible:border-brand-400 dark:border-white/10"
                  >
                    <input
                      type="radio"
                      name="identityDocument"
                      value={id}
                      checked={isSelected}
                      onChange={() => setDocument(id)}
                      className="sr-only"
                    />
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 [&_svg]:size-6">
                      {DOCUMENT_ICONS[id]}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-[0.9375rem] font-semibold lg:text-sm">{option.label}</span>
                      <span className="text-[0.8125rem] text-neutral-500">{option.hint}</span>
                    </span>

                    {/* Radio circle on the right, as in the design. */}
                    <span
                      aria-hidden
                      className={
                        isSelected
                          ? "grid size-6 shrink-0 place-items-center rounded-full border-2 border-brand-600"
                          : "grid size-6 shrink-0 place-items-center rounded-full border-2 border-neutral-300 dark:border-white/20"
                      }
                    >
                      {isSelected && <span className="size-3 rounded-full bg-brand-600" />}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <FormErrorMessage message={error} />
        </div>

        <div className={stepActionsClass}>
          <Button type="submit" size="lg" fullWidth isLoading={isSaving} loadingLabel="Saving">
            Continue
          </Button>
        </div>
      </form>
    </StepScreenLayout>
  );
}
