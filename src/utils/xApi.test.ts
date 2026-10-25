import { describe, expect, it } from 'vitest';

import { oauthHeader } from '~/utils/xApi';

describe('oauthHeader', () => {
  // The worked example from X's "Creating a signature" OAuth 1.0a guide.
  const header = oauthHeader(
    'POST',
    'https://api.twitter.com/1.1/statuses/update.json',
    {
      apiKey: 'xvz1evFS4wEEPTGEFPHBog',
      apiSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
      accessToken: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
      accessSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
    },
    { include_entities: 'true', status: 'Hello Ladies + Gentlemen, a signed OAuth request!' },
    'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
    '1318622958'
  );

  it('produces the documented signature', () => {
    expect(header).toContain('oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"');
  });

  it('sends the OAuth parameters but not the signed request parameters', () => {
    expect(header.startsWith('OAuth ')).toBe(true);
    expect(header).toContain('oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog"');
    expect(header).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(header).not.toContain('status=');
  });
});
