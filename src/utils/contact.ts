/**
 * Contact form → Web3Forms (https://web3forms.com), which emails each message
 * to the inbox the access key was created with. The key is public by design
 * (it only allows sending to that inbox), so it is safe in this public repo;
 * that inbox's address itself never appears here.
 */
export const WEB3FORMS_ACCESS_KEY = '63a488eb-ed04-4d48-a324-848a38e5d118';

export const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

/** Public address shown on the site; Cloudflare Email Routing forwards it to our inbox. */
export const CONTACT_EMAIL = 'contact@yieldbasics.com';

/** Every message's subject starts with this, so one mail filter can file them all. */
export const CONTACT_SUBJECT_TAG = '[YieldBasics]';

export const CONTACT_TOPICS = ['Question', 'Rate correction', 'Add a platform', 'Partnership', 'Other'] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

/** "[YieldBasics] Contact: Rate correction". Unknown or empty topics become "Other". */
export const contactSubject = (topic: string | null | undefined): string => {
  const known = CONTACT_TOPICS.find((t) => t === topic?.trim());
  return `${CONTACT_SUBJECT_TAG} Contact: ${known ?? 'Other'}`;
};

export interface ContactPayload {
  access_key: string;
  subject: string;
  from_name: string;
  topic: string;
  name: string;
  email: string;
  message: string;
}

/** The JSON body Web3Forms expects. Its `email` field doubles as the reply-to address. */
export const buildContactPayload = (fields: Record<string, string | undefined>, accessKey: string): ContactPayload => {
  const topic = CONTACT_TOPICS.find((t) => t === fields.topic) ?? 'Other';
  return {
    access_key: accessKey,
    subject: contactSubject(topic),
    from_name: 'YieldBasics website',
    topic,
    name: (fields.name ?? '').trim(),
    email: (fields.email ?? '').trim(),
    message: (fields.message ?? '').trim(),
  };
};

/** Why the form can't be sent yet, or null when it can. */
export const contactProblem = (payload: ContactPayload): string | null => {
  if (!payload.access_key) return 'The contact form is not set up yet.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'Please enter a valid email address.';
  if (!payload.message) return 'Please write a message.';
  return null;
};
