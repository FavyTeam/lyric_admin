exports.view = function(req, res) {
  var errMsg = req.flash("error");
  var data = {
    title: "Dashboard",
    errors: errMsg
  };
  res.render("dashboard", data);
};
