import { DEMO_DELAY_MS, IS_DEMO_MODE, wait } from "@/config/demoMode";
import { ROUTES } from "@/config/routes";
import * as demo from "@/demo/demoAccounts";
import { notify } from "@/demo/demoNotifications";
import { INVESTMENT_PACKAGES, type PackageId } from "./investmentPackages";
import { investBlockedReason, investOptionFor } from "./packagePolicy";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from "./termsAndConditions";

/**
 * Investment service: the single place the investing screens talk to the
 * server. In DEMO MODE, records are kept on the demo account (src/demo).
 */

export type InvestmentResult = { ok: true } | { ok: false; message: string };

/**
 * Records that the user accepted a package's Terms & Conditions: the step
 * just before paying in. It also makes it their chosen package (saved: the
 * one Invest opens), which they can change until they invest.
 *
 * Server requirements (for the backend):
 *   - store user, package, terms version and time (legal proof of consent);
 *     never overwrite: keep every acceptance
 *   - refuse an investment unless the current terms version was accepted
 *   - refuse a package the investor can't invest in under the package rules
 *     (packagePolicy.ts: for now one investor, one package; top-ups only
 *     within the package maximum)
 */
export async function acceptPackageTerms(packageId: PackageId): Promise<InvestmentResult> {
  // TODO(api): POST /api/investments/terms  { packageId, version: TERMS_VERSION }
  if (IS_DEMO_MODE) {
    await wait(DEMO_DELAY_MS);
    const email = demo.getSessionEmail();
    if (email) {
      // The package rules, checked here as the server will check them.
      const blocked = investBlockedReason(
        investOptionFor(demo.findAccount(email)?.transactions ?? [], packageId),
        packageId,
      );
      if (blocked) return { ok: false, message: blocked };

      const account = demo.findAccount(email);
      const previous = account?.termsAcceptances ?? [];
      const wasChosen = account?.chosenPackageId === packageId;
      demo.updateAccount(email, {
        termsAcceptances: [
          ...previous,
          { packageId, version: TERMS_VERSION, acceptedAt: new Date().toISOString() },
        ],
        chosenPackageId: packageId,
      });
      const { name } = INVESTMENT_PACKAGES[packageId];
      notify(email, {
        kind: "investing",
        title: wasChosen ? `Terms accepted: ${name}` : `You chose ${name}`,
        body: `You agreed to the ${name} terms (effective ${TERMS_EFFECTIVE_DATE}).${wasChosen ? "" : " It's your package: Invest opens it."}`,
        href: ROUTES.invest,
      });
    }
    return { ok: true };
  }
  return { ok: false, message: "Something went wrong. Please try again in a moment." };
}
