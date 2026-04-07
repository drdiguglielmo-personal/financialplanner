## SmartBudget (Sprint 1)

### Prereqs

- Node + npm installed

### Setup

Install dependencies:

```bash
cd "/Users/drewdiguglielmo/Desktop/code studio"
npm install
```

Create your environment file (Back4App / Parse keys):

```bash
cp .env.example .env
```

Edit `.env` and fill in:

- `VITE_BACK4APP_APP_ID`
- `VITE_BACK4APP_JS_KEY`

### Run the app (dev)

```bash
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`).

### Run tests

Run once:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

### Build / preview production

```bash
npm run build
npm run preview
```

### Notes / troubleshooting

- `.env` is ignored by git (your keys won’t be committed).
- If auth shows “Back4App is not configured”, restart the dev server after editing `.env`.
