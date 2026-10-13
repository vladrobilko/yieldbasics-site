# Configure the Contact Form

`src/components/ui/Form.astro` (used by `src/components/widgets/Contact.astro` on `/contact`) renders the markup only. It ships **without** `action`/`method` on purpose: the template does not know where your submissions should go, so until you configure it the browser performs a GET to the same page and nothing is stored.

## Steps

1. Pick a backend and add the attributes to the `<form>` in `src/components/ui/Form.astro`:

   GitHub Pages serves static files only, so use a hosted form service.

   **Formspree / Web3Forms / Getform**:

   ```html
   <form method="POST" action="https://formspree.io/f/<your-id>"></form>
   ```

   **Your own endpoint**: `method="POST" action="https://api.example.com/contact"`, or an Astro API route if you add an adapter.

2. Mark the fields you need as `required` (`inputs` in `src/pages/contact.astro` → `Form.astro` renders `name`, `label`, `type`, `placeholder`, `autocomplete`; add `required` where the input is rendered if you want validation).
3. Create the page users land on after submitting (e.g. `src/pages/thank-you.astro`) if your backend redirects.
4. Test in production, not only in `astro dev`.

## Where things are

| Piece              | File                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| Markup             | `src/components/ui/Form.astro`                                           |
| Card + description | `src/components/widgets/Contact.astro`                                   |
| Demo content       | `src/pages/contact.astro` (`inputs`, `textarea`, `disclaimer`, `button`) |
| Types              | `Form`, `Input`, `Textarea`, `Disclaimer` in `src/types.d.ts`            |

## Notes

- If you prefer to pass `action`/`method` as props instead of editing the component, extend the `Form` interface in `src/types.d.ts` and forward the props from `Contact.astro`; the component intentionally keeps zero opinions about backends.
- Do not put secrets (API keys) in the markup; use a backend that accepts anonymous submissions or a server endpoint.
