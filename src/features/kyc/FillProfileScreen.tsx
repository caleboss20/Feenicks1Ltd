"use client";

/**
 * KYC step 6: "Fill Your Profile".
 *
 *   ← Fill Your Profile
 *   You can always change these details later.
 *
 *               ( 👤 )✏️                 ← optional profile photo
 *
 *   [👤 Full name (as on your ID)   ]
 *   [📅 Date of birth                ]   ← 18+ only
 *   [   Male    ] [   Female    ]       ← as on the ID
 *   [✉  ama@example.com           🔒]   ← the email they signed up with: locked
 *       This is the email you signed up with.
 *   [🇬🇭 +233 │ 24 123 4567            ]
 *   [📍 GhanaPost GPS address        ]
 *       Find it in the GhanaPost GPS app
 *
 *   (              Continue              )
 *
 * Legal name and date of birth must match the ID, so the server can check
 * them against the verified document. Rules: profileValidation.ts.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, LockIcon, MailIcon, MapPinIcon, UserIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass, stepFormClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { TextField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
import { useCurrentAccount } from "@/features/auth/useCurrentAccount";
import { saveProfile } from "./kycService";
import { ProfilePhotoPicker } from "./ProfilePhotoPicker";
import { useKycStore } from "./useKycStore";
import {
  GENDERS,
  latestBirthDate,
  profileSchema,
  type ProfileInput,
  type ProfileValues,
} from "./profileValidation";

/** Where "Continue" leads: the "You're all set" celebration. */
const NEXT_SCREEN = ROUTES.kycAllSet;

export function FillProfileScreen() {
  const router = useRouter();
  const saveProfileInStore = useKycStore((s) => s.saveProfile);
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  // The email they signed up (and verified) with: shown, but locked.
  const current = useCurrentAccount();
  const registeredEmail = current.status === "signed-in" ? current.account.email : "";

  // Free the previous photo preview when it's replaced or the screen closes.
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", dateOfBirth: "", phone: "", digitalAddress: "" },
  });

  const onSubmit = async (values: ProfileValues) => {
    setFormError(null);
    const result = await saveProfile(values, photo?.file ?? null);
    if (!result.ok) {
      // About one field (e.g. the number is on another account): show it under that field.
      if (result.field) setError(result.field, { message: result.message }, { shouldFocus: true });
      else setFormError(result.message);
      return;
    }
    saveProfileInStore(values);
    setIsRedirecting(true);
    router.push(NEXT_SCREEN);
  };

  return (
    <StepScreenLayout
      title="Fill Your Profile"
      subtitle="You can always change these details later."
      backHref={ROUTES.kycSelfie}
      // Wider on desktop so the fields can sit in two columns and the whole
      // form fits on one laptop screen.
      wide
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={stepFormClass}>
        <ProfilePhotoPicker
          photoUrl={photo?.url ?? null}
          onPhotoSelected={(file) => {
            setFormError(null);
            setPhoto({ file, url: URL.createObjectURL(file) });
          }}
          onError={setFormError}
        />

        {/* One column on phones; two columns on desktop. grid-cols-1 (not the
            default auto column) stops wide fields from stretching the page. */}
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 lg:gap-x-5 lg:gap-y-4">
          <TextField
            fieldSize="sm"
            label="Full name"
            placeholder="Full name (as on your ID)"
            autoComplete="name"
            autoCapitalize="words"
            icon={<UserIcon />}
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          <TextField
            fieldSize="sm"
            label="Date of birth"
            type="date"
            max={latestBirthDate()}
            min="1900-01-01"
            autoComplete="bday"
            icon={<CalendarIcon />}
            error={errors.dateOfBirth?.message}
            {...register("dateOfBirth")}
          />

          {/* Gender: two tap options side by side, styled like the inputs. */}
          {/* min-w-0: fieldsets have a built-in minimum width that can overflow small screens. */}
          <fieldset className="min-w-0">
            <legend className="sr-only">Gender</legend>
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((gender) => (
                <label
                  key={gender.id}
                  className="flex h-13 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-neutral-100 text-[0.9375rem] font-semibold text-neutral-500 transition-colors has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-700 has-focus-visible:border-brand-400 lg:text-sm dark:bg-white/5 dark:has-checked:bg-brand-500/10 dark:has-checked:text-brand-300"
                >
                  <input type="radio" value={gender.id} className="sr-only" {...register("gender")} />
                  {gender.label}
                </label>
              ))}
            </div>
            {errors.gender && (
              <p role="alert" className="mt-2 px-1 text-sm text-red-600">
                {errors.gender.message}
              </p>
            )}
          </fieldset>

          {/* The registered email, locked: it's their log-in, verified at sign-up,
              so it can't be changed here. Shown as text in a field-like box
              (not an input, so it never looks editable or takes focus). Not
              part of the form: the server uses the account's own email. */}
          <div>
            <p className="flex h-13 items-center gap-2.5 rounded-xl bg-neutral-100 px-4 dark:bg-white/5">
              <MailIcon className="text-neutral-400" />
              <span className="min-w-0 flex-1 truncate text-base font-medium text-neutral-500 dark:text-neutral-400">
                <span className="sr-only">Email (can&apos;t be changed): </span>
                {registeredEmail}
              </span>
              <LockIcon className="size-4 shrink-0 text-neutral-400" />
            </p>
            <p className="mt-1.5 px-1 text-[0.8125rem] text-neutral-500">
              This is the email you signed up with. It can&apos;t be changed.
            </p>
          </div>

          <TextField
            fieldSize="sm"
            label="Phone number"
            placeholder="24 123 4567"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            // Ghana flag and dialling code in front: everyone is in Ghana.
            icon={
              <span className="flex items-center gap-1.5 border-r border-neutral-300 pr-2.5 text-sm font-semibold text-foreground dark:border-white/15">
                <CountryFlag code="GH" className="size-4.5" />
                +233
              </span>
            }
            error={errors.phone?.message}
            {...register("phone")}
          />

          <div>
            <TextField
              fieldSize="sm"
              label="GhanaPost GPS address"
              placeholder="GPS address, e.g. GA-123-4567"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              icon={<MapPinIcon />}
              error={errors.digitalAddress?.message}
              {...register("digitalAddress")}
            />
            {!errors.digitalAddress && (
              <p className="mt-1.5 px-1 text-[0.8125rem] text-neutral-500">
                Find it in the GhanaPost GPS app.
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            <FormErrorMessage message={formError} />
          </div>
        </div>

        {/* Button: full width on phones; a comfortable width, centred, on desktop. */}
        <div className={`${stepActionsClass} lg:mx-auto lg:w-full lg:max-w-sm`}>
          <Button
            type="submit"
            size="lg"
            fullWidth
            isLoading={isSubmitting || isRedirecting}
            loadingLabel="Saving your profile"
          >
            Continue
          </Button>
        </div>
      </form>
    </StepScreenLayout>
  );
}
