/**
 * Onboarding slide content.
 *
 * Content lives here, separate from the UI, so copy or images can change
 * without touching components. To add a slide, append an entry: the
 * carousel, progress pills and animations adapt automatically.
 *
 * Images live in `public/onboarding/`. Use portrait photos (ideally at
 * least 1080×1920) with the subject in the upper half, because the text
 * card covers the bottom of the screen on mobile.
 */

export type OnboardingSlide = {
  /** Stable key for React lists. */
  id: string;
  image: string;
  /** Describes the photo for screen readers and image search. */
  imageAlt: string;
  /**
   * CSS object-position: which part of the photo stays visible when it's
   * cropped to fit the screen. Aim it at the person's face.
   */
  focus: string;
  /** Short uppercase label above the headline. */
  eyebrow: string;
  title: string;
};

/** How long each slide stays before auto-advancing, in milliseconds. */
export const SLIDE_DURATION_MS = 5000;

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "invest",
    image: "/onboarding/invest.jpg",
    imageAlt: "Smiling woman checking her investments on her phone by the sea",
    focus: "68% 30%",
    eyebrow: "Invest",
    title: "Grow your money with smart, simple investing.",
  },
  {
    id: "portfolio",
    image: "/onboarding/portfolio.jpg",
    imageAlt: "Woman relaxing on a sofa while checking her investment portfolio on her phone",
    focus: "45% 25%",
    eyebrow: "Track",
    title: "Watch your portfolio grow in real time.",
  },
  {
    id: "start",
    image: "/onboarding/start.jpg",
    imageAlt: "Confident chef smiling and pointing towards the camera",
    focus: "50% 20%",
    eyebrow: "Start today",
    title: "Your wealth journey starts with you.",
  },
];
