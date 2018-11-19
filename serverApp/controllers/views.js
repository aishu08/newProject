module.exports = (function () {

    const index = function (req, res) {
        res.render("index");
    };

    const templates = function (req, res) {
        var name = req.params.name;
        res.render('templates/' + name);

    };
    const includes = function (req, res) {
        var name = req.params.name;
        res.render('includes/' + name);

    };

    return {
        index: index,
        templates: templates,
        includes: includes
    }

})();