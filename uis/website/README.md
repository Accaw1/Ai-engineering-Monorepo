# Brasaland Website

The public Brasaland website lives in `uis/website/`. It contains a company landing page and a separate contact-request page. It uses Vite, Tailwind CSS 4, semantic HTML, and browser-native JavaScript; it has no backend.

## Run in GitHub Codespaces

From the repository root:

```sh
cd uis/website
npm install
npx vite --host 0.0.0.0
```

Vite uses port **5173** by default. In Codespaces, open the **Ports** tab, select port 5173, and use its forwarded URL. The landing page is `/` and the contact page is `/contact.html`.

## Build and test

```sh
npm run build
npm test
```

The contact form validates in the browser and displays a local confirmation for valid input. It does not send or store submitted details. The bundled hero photograph is an illustrative image sourced from Unsplash; it does not depict a verified Brasaland restaurant.