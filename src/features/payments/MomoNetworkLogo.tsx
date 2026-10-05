import { MOMO_NETWORKS, type MomoNetwork } from "@/lib/mobileMoney";
import { cn } from "@/lib/utils";

/**
 * A Mobile Money network's logo, round (like CountryFlag), e.g. on the
 * amount screen's From card and the confirm sheet's "Pay with" tiles.
 * Decorative: the network's name is always written next to it.
 */
export function MomoNetworkLogo({ network, className }: { network: MomoNetwork; className?: string }) {
  return (
    // A plain <img> (not next/image): tiny local icons gain nothing from image optimisation.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MOMO_NETWORKS[network].logo}
      alt=""
      aria-hidden
      width={32}
      height={32}
      // The thin outline keeps the edge crisp on any background.
      className={cn("size-8 shrink-0 rounded-full object-cover outline outline-black/5 -outline-offset-1", className)}
    />
  );
}
