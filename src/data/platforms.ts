import platformList from './platforms.json';

/** cex: centralised exchange, defi: on-chain protocol, wallet: custodial wallet with an earn product. */
export type PlatformKind = 'cex' | 'defi' | 'wallet';

export interface Platform {
  id: string;
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
}

export const platformKindLabels: Record<PlatformKind, string> = {
  cex: 'Exchange',
  defi: 'DeFi',
  wallet: 'Wallet',
};

export const platforms = platformList as Platform[];

/** Every platform logo (astro-icon names). */
export const platformLogoNames = platforms.flatMap((platform) => (platform.logo ? [platform.logo] : []));

const byId = new Map(platforms.map((platform) => [platform.id, platform]));

/** The platform with this id. Throws on an unknown id so a typo fails the build. */
export const getPlatform = (id: string): Platform => {
  const platform = byId.get(id);
  if (!platform) throw new Error(`Unknown platform id: ${id}`);
  return platform;
};
