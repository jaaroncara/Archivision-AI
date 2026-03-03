# Run and deploy your Archivision AI app

This contains everything you need to run your app locally.

App preview link: https://ai.studio/apps/cd9a5328-2cab-4341-b344-34d93c2e250c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## API key behavior (AI Studio vs local)

- In Google AI Studio-hosted environments, the app can use the AI Studio key selector (`window.aistudio`).
- In local Vite runs (`npm run dev`), if AI Studio host APIs are unavailable, the app automatically falls back to env-based auth.
- Local fallback checks `GEMINI_API_KEY` first, then `API_KEY`.
- If no env key is set, the app will still show the API key connect screen.
