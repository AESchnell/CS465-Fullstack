# Travlr Getaways — Module Two

This module reorganizes the Express website into routes, controllers, and Handlebars views, following Module Two (pages 76–88) of the CS 465 Full Stack Guide.

## Run it

In this project folder:

```sh
npm ci
npm start
```

Open http://localhost:3000/travel. The homepage is http://localhost:3000/.
If port 3000 is already in use, stop that server or run `PORT=3001 npm start` on macOS and open http://localhost:3001/travel.

## How it works

A request to `/travel` goes through `app.js` → `app_server/routes/travel.js` → `app_server/controllers/travel.js` → `app_server/views/travel.hbs`.

The controller passes the title and active-navigation flag to the view. Handlebars renders the view inside `app_server/views/layouts/layout.hbs`, which includes `{{> header }}` and `{{> footer }}`. `{{title}}` renders the page title, `{{#if ...}}` selects the active navigation item, and `{{{body}}}` inserts the rendered view into the layout.

The homepage also uses a controller and the shared layout. Express static directory indexing is disabled so `/` reaches that controller. The other course pages remain static HTML. Their Home and Travel navigation links now lead to `/` and `/travel`. Original static index and travel files are retained for comparison.

## Folder structure

```text
app_server/
  controllers/
    main.js
    travel.js
  routes/
    index.js
    travel.js
    users.js
  views/
    index.hbs
    travel.hbs
    error.hbs
    layouts/layout.hbs
    partials/header.hbs
    partials/footer.hbs
public/
  css/
  images/
  *.html
app.js
bin/www
```

The folder is named `app_server`, matching the detailed guide. No database model is needed in this module; JSON trip data is introduced in Module Three.

## Verification

Checked successful responses for `/`, `/travel`, `/travel/`, the five remaining main navigation pages, the stylesheet, and a reef image. Both rendered pages contain one HTML document, one header, one footer, and no unresolved Handlebars expressions. Travel displays all three original destinations. An unknown URL returns a rendered 404 page. The travel page was also visually verified in a browser.

## Submit

Submit `travlr-module2.zip` to the course. Publish the `module2` branch to the course GitHub repository separately. The ZIP excludes `.git` and `node_modules`; `npm ci` restores dependencies.
