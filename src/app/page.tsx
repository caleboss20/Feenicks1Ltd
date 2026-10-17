import { LandingHero } from "@/features/landing/LandingHero";
import { SplashScreen } from "@/features/splash/SplashScreen";

/**
 * Route: `/`
 *
 * Phones and tablets: the animated splash, then the welcome slideshow.
 * Laptops and desktops (lg and up): the landing page hero.
 * Both are server-rendered; CSS shows the right one for the screen size, and
 * the splash's redirect only runs on small screens (SplashRedirect).
 *
 * Route files stay thin: the UI lives in `src/features/splash` and
 * `src/features/landing`.
 */
export default function HomePage() {
  return (
    <>
      <div className="lg:hidden">
        <SplashScreen />
      </div>
      <div className="hidden lg:block">
        <LandingHero />
      </div>
    </>
  );
}
