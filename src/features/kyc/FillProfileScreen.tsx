"use client";

/**
 * KYC step 6: "Fill Your Profile".
 *
 *   ← Fill Your Profile
 *   Don't worry, you can always change these details later.
 *
 *               ( 👤 )✏️                 ← optional profile photo
 *
 *   [👤 Full name (as on your ID)   ]
 *   [📅 Date of birth                ]   ← 18+ only
 *   [   Male    ] [   Female    ]       ← as on the ID
 *   [✉  Email                        ]
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
import { CalendarIcon, MailIcon, MapPinIcon, UserIcon } from "@/components/icons";
import { StepScreenLayout, stepActionsClass, stepFormClass } from "@/components/layout/StepScreenLayout";
import { Button } from "@/components/ui/Button";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { FormErrorMessage } from "@/components/ui/FormErrorMessage";
import { TextField } from "@/components/ui/TextField";
import { ROUTES } from "@/config/routes";
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

  // Free the previous photo preview when it's replaced or the screen closes.
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", dateOfBirth: "", email: "", phone: "", digitalAddress: "" },
  });

  const onSubmit = async (values: ProfileValues) => {
    setFormError(null);
    const result = await saveProfile(values, photo?.file ?? null);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    saveProfileInStore(values);
    setIsRedirecting(true);
    router.push(NEXT_SCREEN);
  };

  return (
    <StepScreenLayout
      title="Fill Your Profile"
      subtitle="Don't worry, you can always change these details later."
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

        {/* One column on phones; two columns on desktop. */}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-x-5 lg:gap-y-5">
          <TextField
            label="Full name"
            placeholder="Full name (as on your ID)"
            autoComplete="name"
            autoCapitalize="words"
            icon={<UserIcon />}
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          <TextField
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
          <fieldset>
            <legend className="sr-only">Gender</legend>
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((gender) => (
                <label
                  key={gender.id}
                  className="flex h-15 cursor-pointer items-center justify-center rounded-2xl border border-transparent bg-neutral-100 text-[0.9375rem] font-semibold text-neutral-500 transition-colors has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-700 has-focus-visible:border-brand-400 lg:h-13 lg:rounded-xl lg:text-sm dark:bg-white/5 dark:has-checked:bg-brand-500/10 dark:has-checked:text-brand-300"
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

          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            icon={<MailIcon />}
            error={errors.email?.message}
            {...register("email")}
          />

          <TextField
            label="Phone number"
            placeholder="24 123 4567"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            // Ghana flag and dialling code in front: everyone is in Ghana.
            icon={
              <span className="flex items-center gap-2 border-r border-neutral-300 pr-3 text-[0.9375rem] font-semibold text-foreground lg:text-sm dark:border-white/15">
                <CountryFlag code="GH" className="size-5" />
                +233
              </span>
            }
            error={errors.phone?.message}
            {...register("phone")}
          />

          <div>
            <TextField
              label="GhanaPost GPS address"
              placeholder="GhanaPost GPS address, e.g. GA-123-4567"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              icon={<MapPinIcon />}
              error={errors.digitalAddress?.message}
              {...register("digitalAddress")}
            />
            {!errors.digitalAddress && (
              <p className="mt-1.5 px-1 text-[0.8125rem] text-neutral-500">
                Find your digital address in the GhanaPost GPS app.
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
