// Render the index view with page-specific template data.
const index = (req, res) => {
  res.render('index', { title: 'Travlr Getaways', isHome: true });
};

module.exports = { index };
