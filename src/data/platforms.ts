import platformList from './platforms.json';

/** cex: centralised exchange, defi: on-chain protocol, wallet: custodial wallet with an earn product. */
export type PlatformKind = 'cex' | 'defi' | 'wallet';

/** A sourced fact for the platform page, e.g. { label: "Founded", value: "2018" }. */
export interface PlatformFact {
  label: string;
  value: string;
}

/**
 * Evergreen background for /platforms/<slug>: no rates (those come from the
 * data). Every claim needs a source; re-check the facts every few months.
 */
export interface PlatformProfile {
  /** 3–5 plain sentences. */
  summary: string;
  facts: PlatformFact[];
  /** The platform's own proof-of-reserves page, if it publishes one. */
  proofOfReserves?: string;
  sources: { title: string; url: string }[];
  /** ISO date (YYYY-MM-DD) the profile was last checked. */
  checkedAt: string;
}

export interface Platform {
  id: string;
  /** URL segment of /platforms/<slug> when it should differ from the id (Walt's id is telegram-wallet). */
  slug?: string;
  name: string;
  kind: PlatformKind;
  website: string;
  /** Where "View offer" sends visitors. Referral codes are public by design. */
  referralUrl: string;
  /**
   * Platform logo as an astro-icon name: `token-branded:<name>` from the Web3
   * Icons set (MIT), or an official mark saved in src/assets/icons. Without a
   * logo the avatar shows `mark`.
   */
  logo?: string;
  /** Short text mark shown in the platform avatar when there is no logo. */
  mark: string;
  /** Tailwind classes for the platform avatar. */
  markClass: string;
  profile?: PlatformProfile;
}

export const platformKindLabels: Record<PlatformKind, string> = {
  cex: 'Exchange',
  defi: 'DeFi',
  wallet: 'Wallet',
};

export const platforms = platformList as Platform[];

/** Every platform logo (astro-icon names). */
export const platformLogoNames = platforms.flatMap((platform) => (platform.logo ? [platform.logo] : []));

/** URL segment of the platform page: "bybit", or "walt" for telegram-wallet. */
export const platformSlug = (platform: Pick<Platform, 'id' | 'slug'>): string => platform.slug ?? platform.id;

const byId = new Map(platforms.map((platform) => [platform.id, platform]));

/** The platform with this id. Throws on an unknown id so a typo fails the build. */
export const getPlatform = (id: string): Platform => {
  const platform = byId.get(id);
  if (!platform) throw new Error(`Unknown platform id: ${id}`);
  return platform;
};
