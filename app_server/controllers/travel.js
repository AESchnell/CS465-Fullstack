const fs = require('fs');
const path = require('path');

// Load the local prototype data once at startup. Restart after editing trips.json.
const trips = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/trips.json'), 'utf8')
);

// Pass trip data to the Handlebars view through the MVC controller.
const travel = (req, res) => {
  res.render('travel', { title: 'Travel - Travlr Getaways', isTravel: true, trips });
};

module.exports = { travel };
