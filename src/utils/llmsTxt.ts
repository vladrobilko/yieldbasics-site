/**
 * /llms.txt (https://llmstxt.org): a short Markdown map of the site for AI
 * assistants. Built from data at build time, so the coin list and best rates
 * match the day's rates.
 */
export interface LlmsLink {
  title: string;
  url: string;
  /** Short note after the link. */
  note?: string;
}

export interface LlmsInput {
  siteName: string;
  summary: string;
  /** Plain sentences under the summary: what the data is and how it is collected. */
  details: string[];
  sections: { title: string; links: LlmsLink[] }[];
}

const linkLine = ({ title, url, note }: LlmsLink) => `- [${title}](${url})${note ? `: ${note}` : ''}`;

export const buildLlmsTxt = ({ siteName, summary, details, sections }: LlmsInput): string =>
  [
    `# ${siteName}`,
    '',
    `> ${summary}`,
    '',
    ...details.flatMap((line) => [line, '']),
    ...sections
      .filter((section) => section.links.length > 0)
      .flatMap((section) => [`## ${section.title}`, '', ...section.links.map(linkLine), '']),
  ]
    .join('\n')
    .trimEnd() + '\n';
