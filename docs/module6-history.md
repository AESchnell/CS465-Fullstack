# Travlr Getaways — Module Six

Angular trip administration SPA backed by the existing Express API and MongoDB database. The public Handlebars Travel page reads the same API, so saved trips appear in both applications.

## Run locally

Use Node.js 24 LTS (supported by Angular 21) and a running local MongoDB instance. From `travlr`:

```sh
npm ci
npm run migrate
npm start
```

`migrate` upgrades Module Five's trip-code index to enforce uniqueness; it does not change trip records. It stops if duplicate codes exist. Startup waits for the database and indexes before accepting requests.

For a **new assignment database**, run `npm run seed` after migration and before starting the server. Seeding replaces the trips collection with the four records in `data/trips.json`, including Coral Cove Escape. Do not seed a database whose records you need to preserve.

In a second terminal:

```sh
cd app_admin
npm ci
npm start
```

Open the admin app at **http://localhost:4200** and the public site at **http://localhost:3000/travel**. The Angular development server proxies `/api` and `/images` to Express on port 3000; no cross-origin configuration is needed. Change `app_admin/proxy.conf.json` if Express uses another port.

MongoDB defaults to `mongodb://127.0.0.1/travlr`. Set `MONGODB_URI` or `DB_HOST` to use another assignment database. On the original development machine, existing database files are in `../tmp/mongodb-module4`; those files are intentionally excluded from the ZIP.

This is the Module Six local course application. Authentication is part of the subsequent module.

## Implementation

| Requirement | Files / behavior |
| --- | --- |
| Angular application structure | CLI-generated `app_admin`, Angular 21 standalone components, TypeScript, HTML, CSS, Bootstrap 5 |
| Trip list and reusable cards | `trip-listing` loads the collection; `trip-card` renders each trip with edit/delete actions |
| Shared API data service | `services/trip-data.service.ts` uses Angular HttpClient for GET, POST, PUT, DELETE |
| Add and edit trips | `add-trip` and `edit-trip` use a shared reactive `trip-form`; edit routes contain the trip code and survive refresh |
| Validation | Required fields, code format, date, nonnegative price, image filename; immutable code when editing; duplicate codes return 409 |
| Delete trips | Inline confirmation before removal; the list updates after a successful DELETE |
| REST backend | `app_api/controllers/trips.js` and `app_api/routes/index.js` implement all four methods |
| Consistent public site | Express Travel page consumes the same persisted trip collection |

Descriptions permit basic paragraph/emphasis HTML; writes remove scripts and unsafe attributes. API updates explicitly select allowed fields and run Mongoose validation.

The guide was written for Angular 17 and permits newer versions. This implementation uses Angular 21 with the guide's component names and `app_admin` layout, modern standalone imports, signals for asynchronous UI state, and a development proxy. See [Angular compatibility](https://angular.dev/reference/versions) and [CLI generation options](https://angular.dev/cli/new).

## API

| Request | Success | Main errors |
| --- | --- | --- |
| GET `/api/trips` | 200; array | 500 database error |
| GET `/api/trips/:tripCode` | 200; one-element array, matching the course guide | 404 missing; 500 database error |
| POST `/api/trips` | 201; created object | 400 invalid; 409 duplicate |
| PUT `/api/trips/:tripCode` | 200; updated object | 400 invalid; 404 missing |
| DELETE `/api/trips/:tripCode` | 200; confirmation | 404 missing |

POST and PUT accept `code`, `name`, `length`, `start`, `resort`, `perPerson`, `image`, and `description`. Unsupported methods return 405 with an Allow header; missing API routes return JSON 404.

## Verification performed

- **19 automated backend tests passed** (`npm test`). Tests exercise HTTP routes, validation, duplicate handling, missing records, updates, deletion, HTML sanitization, and public-site error behavior.
- **Angular production build passed** (`cd app_admin && npm run build`), including strict TypeScript/template compilation.
- **Postman collection: 14 requests, 22 assertions passed** against the live Express server and MongoDB using Newman, Postman's command-line collection runner.
- API and image requests through the Angular development proxy returned JSON and JPEG responses respectively.
- Coral Cove Escape (`CORC270615`) was added via the API proxy at $1,199 and updated to **$1,299**. MongoDB, the API and the public Travel page reflect the change. It is preserved in seed data.

Evidence is in `verification/module6-tests.txt`, `module6-build.txt`, `module6-newman.txt`, `module6-newman.json`, and `module6-integration.json`.

To repeat the API checks, import `postman/Travlr-Module6.postman_collection.json` into Postman and run the collection, or:

```sh
npx --yes newman@6.2.2 run postman/Travlr-Module6.postman_collection.json
```

The collection creates and removes only its own temporary `M6TEST…` trip. It preserves the four course sample trips. Module Five evidence is retained for history; its collection's old POST=405 expectation is superseded by Module Six.

The price form uses a numeric control and serializes the price to the model’s string format. The API also accepts finite numeric prices. Numeric POST/PUT persistence was verified through the Angular proxy; evidence is in `verification/module6-price-fix.json`.

## Remaining browser verification and screenshots

**Browser interaction has not been verified and the required screenshots have not been captured.** The browser tool was denied access because its admin-enforced security policy could not be verified. The build and API checks above are not substitutes for browser verification.

With both servers running, use your browser to complete the following:

1. Open `http://localhost:4200`. Confirm four trip cards and working images. Save a screenshot as `01-card-listing.png` with Coral Cove Escape visible.
2. Click **Edit trip** on Coral Cove Escape. Confirm its fields load and the trip code is read-only. Save `02-edit-screen.png` with the populated form visible.
3. Change its price from 1299 to 1349, click **Save changes**, and confirm the success message and updated card. Save `03-update-screen.png` while both are visible. Refresh the page and check that the edit persists. Open `/travel` and confirm the trip remains present.
4. Exercise **Add trip** with a temporary unique code and check the new card and public website. Confirm required fields and duplicate-code messages. Delete only that temporary trip through the confirmation UI.

The three screenshots must be submitted separately as images alongside `travlr.zip`. Do not substitute the older Module Five Postman screenshots.

## Submission

The assignment branch is `module6`. The ZIP includes source, lockfiles, four seed records, the Postman collection, documentation, and verification results. It excludes node_modules, Angular build/cache output, Git history, and database storage.

Submit `travlr.zip` and the three browser screenshots in Brightspace after the remaining browser checks. Historical Module Five notes are in `docs/module5-history.md`.
