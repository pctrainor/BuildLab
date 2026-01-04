# BuildLab# React + TypeScript + Vite



**Crowdsourced Design Request Platform** - Where ideas get built.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## FeaturesCurrently, two official plugins are available:



- 🏆 **Weekly Competitions** - Submit ideas to compete for top spots- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- 🗳️ **Community Voting** - Let the community vote on the best ideas- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- 💰 **Campaigns** - Businesses post project bounties for builders

- 🤖 **AI Project Generation** - Get market research, PRDs, tech specs, and code prototypes## React Compiler

- 👤 **User Profiles** - Track your submissions, votes, and wins

- 📊 **Leaderboards** - See top ideas and top contributorsThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



## Tech Stack## Expanding the ESLint configuration



- **Frontend**: React 18 + TypeScript + ViteIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **Styling**: Tailwind CSS v4

- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)```js

- **Payments**: Stripeexport default defineConfig([

- **AI**: OpenAI GPT-4o  globalIgnores(['dist']),

- **Hosting**: Vercel  {

    files: ['**/*.{ts,tsx}'],

## Getting Started    extends: [

      // Other configs...

1. Clone the repository

2. Install dependencies: `npm install`      // Remove tseslint.configs.recommended and replace with this

3. Copy `.env.example` to `.env` and fill in your keys      tseslint.configs.recommendedTypeChecked,

4. Run development server: `npm run dev`      // Alternatively, use this for stricter rules

      tseslint.configs.strictTypeChecked,

## Environment Variables      // Optionally, add this for stylistic rules

      tseslint.configs.stylisticTypeChecked,

```env

VITE_SUPABASE_URL=your_supabase_url      // Other configs...

VITE_SUPABASE_ANON_KEY=your_anon_key    ],

VITE_GIPHY_API_KEY=your_giphy_key    languageOptions: {

```      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## Supabase Edge Functions        tsconfigRootDir: import.meta.dirname,

      },

- `create-checkout` - Stripe checkout sessions for submission packs      // other options...

- `stripe-webhook` - Handle Stripe payment events    },

- `generate-project` - AI multi-agent project generation  },

])

## Deployment```



```bashYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

# Deploy to Vercel

npx vercel --prod```js

// eslint.config.js

# Deploy Edge Functionsimport reactX from 'eslint-plugin-react-x'

supabase functions deploy --allimport reactDom from 'eslint-plugin-react-dom'

```

export default defineConfig([

## License  globalIgnores(['dist']),

  {

MIT    files: ['**/*.{ts,tsx}'],

    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
