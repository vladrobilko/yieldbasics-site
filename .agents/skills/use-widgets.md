# Use the Widgets

Every section of a page is a widget from `src/components/widgets/`. Widgets take props (typed in `src/types.d.ts`), share the same base (`WidgetWrapper` + `Headline`) and therefore accept the same base props:

| Prop                           | Purpose                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `id`                           | Anchor for in-page links (`href="#pricing"`).                                                                                 |
| `title`, `subtitle`, `tagline` | Section headline. Also available as slots for HTML content.                                                                   |
| `isDark`                       | Force the dark variant of the section.                                                                                        |
| `bg` (slot)                    | Custom background, e.g. `<Fragment slot="bg"><div class="absolute inset-0 bg-blue-50 dark:bg-transparent"></div></Fragment>`. |
| `classes`                      | Class overrides: `classes={{ container: 'max-w-5xl', headline: { title: 'text-4xl' } }}`.                                     |

Images accept `{ src, alt }` where `src` is a local import (`~/assets/images/...`) or a remote URL. Icons come from the Tabler set (`tabler:rocket`); check `@iconify-json/tabler/icons.json` before using a name.

## Catalogue

### Hero and openers

| Widget         | Use it for                                                                         | Key props                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Hero`         | Centred hero, image below the text                                                 | `actions`, `image` (`aspect: 'auto'` shows a transparent illustration whole), `badge`, `content` slot               |
| `Hero2`        | Split hero, text left / image right                                                | same as `Hero`                                                                                                      |
| `HeroText`     | Text-only hero for short pages                                                     | `callToAction`, `callToAction2`, `badge`                                                                            |
| `Announcement` | Bar above the header                                                               | `badge`, `text`, `href`, `showStars`                                                                                |
| `SocialProof`  | Strip of trust signals (ratings, counts, badges)                                   | `items[{ value, label, icon \| image, rating?, href? }]`, `layout` (`strip` \| `badges`)                            |
| `QuickStart`   | TL;DR for developers: the install command with a copy button, three facts, buttons | `commands[]` (string or `{ command, comment }`), `prompt`, `items[{ title, description, icon }]`, `actions`, `note` |
| `Countdown`    | Count down to a launch date                                                        | `date` (ISO 8601), `labels`, `expiredText`, `callToAction`                                                          |

### Features and content

| Widget         | Use it for                                         | Key props                                                                                                                             |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Features`     | Icon + text grid                                   | `items`, `columns` (2–4)                                                                                                              |
| `Features2`    | Cards with icons; cards link when `href` is set    | `items[{ href? }]`, `columns`                                                                                                         |
| `Features3`    | Compact list, optional image                       | `items`, `image`, `columns`, `isBeforeContent`                                                                                        |
| `FeatureTabs`  | Tabs whose image changes with the selected feature | `items[{ title, description, icon?, image }]`, `orientation`                                                                          |
| `Bento`        | Asymmetric card grid with a visual per card        | `items[{ span (1–3), rowSpan?, image?, icon?, href? }]`, `columns` (3 \| 4). Make spans add up to a multiple of `columns`             |
| `Content`      | Text + image split with a list of items            | `items`, `image` (with `aspect`: `1/1` default, `4/3`, `3/4`, `auto`), `isReversed`, `isAfterContent`, `callToAction`, `content` slot |
| `Steps`        | Numbered vertical steps with an image              | `items`, `image`, `callToAction`, `isReversed`                                                                                        |
| `Steps2`       | Numbered steps in a horizontal layout              | `items`, `callToAction`, `isReversed`                                                                                                 |
| `Timeline`     | Dated entries (history, roadmap, changelog)        | `items[{ date, title, description, icon?, image?, highlight?, ghost? }]`, `layout` (`vertical` \| `alternate`)                        |
| `Gallery`      | Image grid with a native `<dialog>` lightbox       | `images[{ src, alt, caption? }]`, `columns` (2–4), `lightbox`                                                                         |
| `Projects`     | Portfolio, case studies, "our work"                | `items[{ title, description, image, tags[], href?, result? }]`, `columns`, `callToAction`                                             |
| `Video`        | Deferred video (poster first, player on click)     | `youtube` \| `vimeo` \| `src`, `poster`, `caption`, `videoTitle`                                                                      |
| `Integrations` | Tools the product works with                       | `items[{ name, description?, icon \| image, href? }]`, `columns`                                                                      |
| `Note`         | One-line callout                                   | `title`, `description`, `variant` (`info` \| `success` \| `warning`), `icon`                                                          |

### Proof, pricing and objections

| Widget         | Use it for                                         | Key props                                                                                                                                                                              |
| -------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Stats`        | Big numbers                                        | `stats[{ amount, title, icon? }]`, `countUp`                                                                                                                                           |
| `Brands`       | Logo cloud                                         | `images[{ src, alt, href? }]`, `variant` (`grid` \| `marquee`), `grayscale`, `boxed`                                                                                                   |
| `Testimonials` | Several quotes                                     | `testimonials[{ testimonial, name, job, image, rating?, logo? }]`, `layout` (`grid` \| `masonry`), `columns`, `callToAction`                                                           |
| `Quote`        | One large quote                                    | `quote`, `name`, `job`, `image`, `logo`, `rating`                                                                                                                                      |
| `Team`         | People grid                                        | `members[{ name, role, image, bio?, socials[{ icon, href }] }]`, `columns`                                                                                                             |
| `Pricing`      | Plan cards, optional monthly/yearly toggle         | `prices[{ title, price (number \| string \| { monthly, yearly }), period, items, callToAction, hasRibbon, ribbonTitle, highlight?, note? }]`, `currency`, `billingLabels`              |
| `Comparison`   | Feature matrix or "us vs them" table               | `columns[{ title, subtitle?, highlight?, callToAction? }]`, `rows[{ label, description?, values (boolean \| string)[], group? }]`, `mode` (`features` \| `versus`), `firstColumnLabel` |
| `FAQs`         | Accordion (native `<details>`, one open at a time) | `items[{ title, description }]`, `defaultOpen` (index, `-1` for all closed), `collapsible` (`false` = classic always-open grid with `columns`), `schema` (emit FAQPage JSON-LD)        |

### Conversion

| Widget         | Use it for                           | Key props                                                                                                                        |
| -------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `CallToAction` | Closing call to action               | `actions`, `layout` (`card` \| `banner`)                                                                                         |
| `Contact`      | Full form in a card                  | `inputs`, `textarea`, `disclaimer`, `button`, `description`. The form has no backend by default; see `configure-contact-form.md` |
| `Newsletter`   | One-field signup band                | `placeholder`, `button`, `disclaimer`, `action`, `method`, `layout` (`band` \| `card`). No backend by default                    |
| `StickyCTA`    | Bottom bar on phones after scrolling | `text`, `href`, `label`, `showAfter` (px), `mobileOnly`                                                                          |

### Blog

`BlogLatestPosts` and `BlogHighlightedPosts` (`title`, `information`, `count` / `postIds`, `linkText`, `linkUrl`) list posts from `src/data/post/`.

## Rules of thumb

- Use the widget as it is; do not fork it to change one class. `classes` and the `bg` slot cover most layout needs.
- Pass real `alt` text and keep one `<h1>` per page (the hero); widgets render `<h2>`/`<h3>`.
- Prefer `href` on items over a separate button when a card is the thing to click.
- Sections that ask for something (`Contact`, `Newsletter`) come right after the proof that earns it.
- Run `npm run check` after editing props: the types catch misspelled or missing props.
