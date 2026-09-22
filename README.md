# AttendMate

AttendMate is a semester attendance tracker for students. It tracks
attendance subject-by-subject, predicts how many classes you can safely
skip, warns you before you drop below the minimum requirement, and offers
AI-assisted coaching based on your numbers.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React, file-based routing, SSR)
- TypeScript
- Tailwind CSS
- Supabase (auth + database)

## Development

You'll need Node.js (or Bun) installed.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

Copy `.env` and fill in your own Supabase project credentials
(`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
and the matching `VITE_SUPABASE_*` variants). AI coaching is optional and
falls back to a rule-based summary if `AI_API_KEY` is not set — see
`src/lib/ai.functions.ts` for the provider config (`AI_API_KEY`,
`AI_API_URL`, `AI_MODEL`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — lint the project
- `npm run format` — format with Prettier
