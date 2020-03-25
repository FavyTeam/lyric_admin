let Products = require("../models/products");
let Music = require("../models/music");
let Interview = require("../models/interview");

exports.getAllCategories = async (req, res) => {
  let { search } = req.query;
  search = search.replace('(', '\\(');
  search = search.replace(')', '\\)');
  
  const productsP = Products.find({ $or: [{ title: new RegExp(search, 'gim') }, { description: new RegExp(search, 'gim') }] });
  const musicsP = Music.find({ $or: [{ title: new RegExp(search, 'gim') }, { description: new RegExp(search, 'gim') }] });
  const interviewsP = Interview.find({ $or: [{ title: new RegExp(search, 'gim') }, { description: new RegExp(search, 'gim') }] });

  const [products, music, interviews] = await Promise.all([productsP, musicsP, interviewsP]);

  const result = { products, music, interviews };
  res.send(result);

};
