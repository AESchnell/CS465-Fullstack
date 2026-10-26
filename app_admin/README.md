# Travlr Admin — Module Seven

Angular 21 administration SPA with login/logout, session tokens, guarded edit routes, and authenticated CRUD requests. See the parent README for account setup, security design, verification results, and the remaining manual browser check.

Use Node 24 LTS. Run `npm ci` and `npm start` with Express on port 3000. Visit http://127.0.0.1:4200/login. Create the first administrator from the parent directory with `npm run setup:admin` and read its private `.admin-login.txt`.

`npm test` runs Angular component/service tests with Vitest. `npm run build` creates a production build. API and image requests use `proxy.conf.json`.
