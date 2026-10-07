"use client";

import { useEffect, useState } from "react";
import type { PackageId } from "@/features/packages/investmentPackages";
import type { PackageWallet } from "./walletModel";
import { getWallet } from "./walletService";

/** The wallet for a package (created on first look if it predates wallets). Null while loading. */
export function useWallet(packageId: PackageId | null): PackageWallet | null {
  const [wallet, setWallet] = useState<PackageWallet | null>(null);
  useEffect(() => {
    if (!packageId) return;
    let cancelled = false;
    void getWallet(packageId).then((found) => {
      if (!cancelled) setWallet(found);
    });
    return () => {
      cancelled = true;
    };
  }, [packageId]);
  return wallet && wallet.packageId === packageId ? wallet : null;
}
