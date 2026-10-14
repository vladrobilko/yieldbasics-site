import { describe, expect, it } from 'vitest';

import { buildContactPayload, CONTACT_SUBJECT_TAG, contactProblem, contactSubject } from '~/utils/contact';

describe('contactSubject', () => {
  it('tags every subject so one mail filter catches them all', () => {
    expect(contactSubject('Rate correction')).toBe('[YieldBasics] Contact: Rate correction');
    expect(contactSubject('Question').startsWith(CONTACT_SUBJECT_TAG)).toBe(true);
  });

  it('falls back to "Other" for unknown or empty topics', () => {
    expect(contactSubject('Spam topic')).toBe('[YieldBasics] Contact: Other');
    expect(contactSubject('')).toBe('[YieldBasics] Contact: Other');
    expect(contactSubject(undefined)).toBe('[YieldBasics] Contact: Other');
  });
});

describe('buildContactPayload', () => {
  it('builds the Web3Forms body with trimmed fields', () => {
    expect(
      buildContactPayload(
        { topic: 'Partnership', name: ' Ann ', email: ' ann@example.org ', message: ' Hi \n' },
        'key-123'
      )
    ).toEqual({
      access_key: 'key-123',
      subject: '[YieldBasics] Contact: Partnership',
      from_name: 'YieldBasics website',
      topic: 'Partnership',
      name: 'Ann',
      email: 'ann@example.org',
      message: 'Hi',
    });
  });

  it('never lets the subject be set from outside the topic list', () => {
    expect(buildContactPayload({ topic: '<script>' }, 'k').subject).toBe('[YieldBasics] Contact: Other');
  });
});

describe('contactProblem', () => {
  const ok = buildContactPayload({ email: 'a@b.co', message: 'Hello' }, 'k');

  it('accepts a complete message', () => {
    expect(contactProblem(ok)).toBeNull();
  });

  it('flags a missing key, a bad email or an empty message', () => {
    expect(contactProblem({ ...ok, access_key: '' })).toMatch(/not set up/);
    expect(contactProblem({ ...ok, email: 'nope' })).toMatch(/valid email/);
    expect(contactProblem({ ...ok, message: '' })).toMatch(/write a message/);
  });
});
