# Travlr Getaways — Module Five

## API refactor

The request flow is now **browser → Express MVC controller → REST API → Mongoose → MongoDB**. The Travel page no longer reads `trips.json`; that file is only seed data.

- `app_api/models/` contains the database connection, trip schema, and seed script moved from `app_server/models/`.
- `app_api/controllers/trips.js` uses `Trip.find({}).exec()` for the collection and `Trip.find({ code: req.params.tripCode }).exec()` for a specific trip.
- `app_api/routes/index.js` defines the routes mounted at `/api` in `app.js`.
- `app_server/controllers/travel.js` calls the API with Node's built-in `fetch`, checks the HTTP status and JSON shape, and renders the Handlebars view.
- Trip names and images link to their individual API responses, as demonstrated in the guide.

`GET` is the HTTP method used by the client. `find()` is the Mongoose database query used inside the API; FIND is not an HTTP method.

## Endpoints and errors

| Request | Expected response |
| --- | --- |
| `GET /api/trips` | 200; JSON array of all trips (or `[]` for an empty collection) |
| `GET /api/trips/GALR210214` | 200; JSON array containing the matching trip, following the guide's FIND response shape |
| `GET /api/trips/DOESNOTEXIST` | 404; JSON error message |
| `GET /api/unknown` | 404; JSON error message |
| `POST /api/trips` | 405; JSON error and Allow header; no database changes |
| Either trip endpoint when its database query fails | 500; JSON error without internal database details |

The Travel page shows a helpful message for an empty list. HTTP errors, invalid JSON, non-array JSON, network failures, and a 15-second timeout produce a friendly page with status 502.

## Run

Use Node.js 20.19 or newer and a running MongoDB instance.

```sh
npm ci
npm run seed
npm start
```

Open http://localhost:3000/travel or http://localhost:3000/api/trips.

The default database is `mongodb://127.0.0.1/travlr`. Override it with `MONGODB_URI` or `DB_HOST`. Set `PORT` to change the website port. The website's API client follows that port automatically; set `API_BASE_URL` only if the API runs elsewhere (for example `http://127.0.0.1:3001`, without `/api`). Keep credentials out of source control.

**Seeding replaces the selected database's trips collection with the three sample records.** Use it only for the assignment database. The application does not seed on startup. The existing Module Four records were reused during Module Five verification.

On the development machine, the existing local database files are outside the submission folder in `../tmp/mongodb-module4`. If its process has stopped, start it from the application folder with:

```sh
mongod --dbpath ../tmp/mongodb-module4 --bind_ip 127.0.0.1 --port 27017
```

When using the ZIP on another machine, use your own MongoDB service and seed the assignment database.

## Testing

```sh
npm test
```

All **11 automated tests passed**. They cover schema validation, HTTP routes, FIND filters, empty results, missing trips, unsupported methods, simulated database failures, and website API error handling. Database failure tests use controlled query failures; they do not alter the live database.

Import `postman/Travlr-Module5.postman_collection.json` into Postman. The collection's `baseUrl` variable defaults to `http://127.0.0.1:3000`. Start the application, choose the collection, and run its requests. The expected data is the three sample trips in `data/trips.json`.

The same collection was executed against the live application and existing MongoDB database using **Newman 6.2.2, Postman's command-line collection runner**:

```sh
npx --yes newman@6.2.2 run postman/Travlr-Module5.postman_collection.json \
  --reporters cli,json --reporter-json-export verification/module5-newman.json
```

All **8 requests and 25 assertions passed**. The collection checks every sample trip, the full collection, error status codes, JSON responses, and the rendered Travel page. Evidence is saved in `verification/module5-newman.json` and `verification/module5-tests.txt`. The older `mongodb-inspection.json` is retained as Module Four database evidence.

On October 4, 2026, the Postman desktop Lightweight API Client also verified the full trip list (200), Gale Reef by trip code (200), and an unknown trip code (404). Screenshots are included in `verification/postman-all-trips.png`, `verification/postman-single-trip.png`, and `verification/postman-missing-trip.png`. The full collection was rerun with Newman: all 8 requests and 25 assertions passed.

## Feedback verification

The requested MongoDB API integration is implemented: `GET /api/trips` queries the Trip model and returns JSON, and `/travel` consumes that endpoint. A fresh integration check on October 4, 2026 returned HTTP 200, matched every field in all three API records to MongoDB, and confirmed that the Travel page rendered all three trip links. Evidence is saved in `verification/api-integration.json`. All 11 automated tests also passed again.

## Submission

The accompanying `travlr.zip` contains this application, `data/trips.json`, dependency lockfile, Postman collection, tests, and verification results. It excludes installed dependencies, Git history, and database storage.

The assignment branch is `module5`. Course submission must be completed separately by uploading the ZIP. To publish this branch from another checkout:

```sh
git push --set-upstream origin module5
```

## Module Five rubric mapping

| Criterion | Implementation and evidence |
| --- | --- |
| Establish routes | `/api/trips` and `/api/trips/:tripCode`, mounted through `app_api/routes/index.js` |
| MVC and REST API | Database connection and model live in `app_api/models`; API controllers use Mongoose `find`; the website controller fetches API JSON and renders the Travel view |
| Specific-trip retrieval | `Trip.find({ code: req.params.tripCode }).exec()`; all three sample codes checked by the Postman collection |
| HTTP errors | Missing trip: 404; unknown API route: 404; unsupported method: 405; query failure: 500; website API failure: 502 |
| JSON responses | Collection and individual-trip responses checked in Postman desktop and the automated collection runner |
| Submission contents | Application, `data/trips.json`, dependency lockfile, Postman collection, automated tests, and verification evidence |
