import { IS_DEMO_MODE } from "@/config/demoMode";
import * as demo from "@/demo/demoAccounts";
import { INVESTMENT_PACKAGES, type PackageId } from "@/features/packages/investmentPackages";
import type { PackageWallet } from "./walletModel";

/**
 * Wallets service: the single place screens get a package wallet from.
 *
 * TODO(api): the server creates the wallet when the package is chosen
 * (terms accepted) and returns it with the account: GET /api/wallets.
 */

function newWalletId(packageId: PackageId): string {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => byte % 10).join("");
  return `F1-${INVESTMENT_PACKAGES[packageId].ticker}-${digits}`;
}

/**
 * Demo: the account's wallet for this package, created if it doesn't have
 * one yet (when they choose the package; or, for accounts that chose one
 * before wallets existed, the first time it's looked at).
 */
export function ensureDemoWallet(email: string, packageId: PackageId): PackageWallet | null {
  const account = demo.findAccount(email);
  if (!account) return null;
  const existing = account.wallets?.find((wallet) => wallet.packageId === packageId);
  if (existing) return existing;
  const wallet: PackageWallet = { id: newWalletId(packageId), packageId, createdAt: new Date().toISOString() };
  demo.updateAccount(email, { wallets: [...(account.wallets ?? []), wallet] });
  return wallet;
}

/** The logged-in user's wallet for a package (their chosen or invested one). */
export async function getWallet(packageId: PackageId): Promise<PackageWallet | null> {
  if (!IS_DEMO_MODE) return null;
  const email = demo.getSessionEmail();
  return email ? ensureDemoWallet(email, packageId) : null;
}
