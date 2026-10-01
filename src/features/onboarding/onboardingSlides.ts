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

/*
 * The five slides tell one story: invest → grow → track → trust → start.
 * Copy rule: never promise returns ("guaranteed", "risk-free"); regulators
 * don't allow it for investment products.
 */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "invest",
    image: "/onboarding/invest.jpg",
    imageAlt: "Smiling woman checking her investments on her phone by the sea",
    focus: "68% 30%",
    eyebrow: "Invest smarter",
    title: "Make your money work as hard as you do.",
  },
  {
    id: "grow-wealth",
    // ⚠️ Watermarked Rawpixel preview: replace with the licensed (unwatermarked) file before launch.
    image: "/onboarding/grow-wealth.jpg",
    imageAlt: "Smiling man in a blazer looking at his phone, pleased with his investments",
    focus: "45% 35%",
    eyebrow: "Grow your wealth",
    title: "Build lasting wealth, one smart step at a time.",
  },
  {
    id: "portfolio",
    image: "/onboarding/portfolio.jpg",
    imageAlt: "Woman on a green sofa with a coffee, checking her investment portfolio on her phone",
    focus: "55% 30%",
    eyebrow: "Track your portfolio",
    title: "Watch every cedi grow, in real time.",
  },
  {
    id: "peace-of-mind",
    image: "/onboarding/peace-of-mind.jpg",
    imageAlt: "Relaxed woman sitting on a sofa, smiling at her phone",
    focus: "60% 40%",
    eyebrow: "Invest with confidence",
    // ‑ = non-breaking hyphen, so "bank-grade" never splits across two lines.
    title: "Your money, protected by bank‑grade security.",
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
