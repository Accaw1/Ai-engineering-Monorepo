# Brasaland Website

The public Brasaland website lives in `uis/website/`. It contains a company landing page, a Brasa Points application page, and a separate contact-request page. It uses Vite, Tailwind CSS 4, semantic HTML, and browser-native JavaScript; it has no backend.

## Run in GitHub Codespaces

From the repository root, install dependencies and start the Vite development server:

```sh
cd uis/website
npm install
npm run dev -- --host 0.0.0.0
```

Vite serves on port **5173** by default. In Codespaces, open the **Ports** tab and open the forwarded port 5173 URL. The landing page is `/`, the Brasa Points application is `/application.html`, and the contact page is `/contact.html`.

## Build and test

```sh
npm run build
npm test
```

The contact form and Brasa Points signup validate in the browser and display local confirmations. Neither form sends or stores submitted details. Online ordering is not available yet. The bundled hero photograph is an illustrative image sourced from Unsplash; it does not depict a verified Brasaland restaurant.