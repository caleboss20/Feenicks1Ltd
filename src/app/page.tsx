import { SplashScreen } from "@/features/splash/SplashScreen";

/**
 * Route: `/`
 *
 * Route files stay thin: they only compose feature components. The actual
 * UI lives in `src/features/splash`. Title/description come from the
 * root layout's default metadata.
 */
export default function HomePage() {
  return <SplashScreen />;
}
