// Render the travel view with page-specific template data.
const travel = (req, res) => {
  res.render('travel', { title: 'Travel - Travlr Getaways', isTravel: true });
};

module.exports = { travel };
