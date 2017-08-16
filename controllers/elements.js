let db = require('../lib/database'),
    handlebars = require('handlebars');

let elementsListTpl = require('../templates/elementslist.handlebars');

// List all elements registered in the database for the selected domain
let listElements = function(req, res, status = "") {
    const SHOW_JSON_LENGTH = 600;
    db.getSiteElements(req.params.domain, res, function(err, results) {
        let list = results.map(json => {
            return {
                hash: json.hash,
                json: json.json.substring(0, SHOW_JSON_LENGTH) + (json.json.length > SHOW_JSON_LENGTH ? "...+" + (json.json.length - SHOW_JSON_LENGTH) : "")
            };
        });
        let template = handlebars.compile(elementsListTpl.tpl());
        res.send(template({results: list, selectedDomain: req.params.domain, status: status}));
    });
}

// Add json data for the current domain and specified hash
let addJson = function(req, res) {
    let hash = (req.body.hash) ? req.body.hash : null;
    let path = decodeURI(req.body.path);

    if (path || hash) {
        try {
            JSON.parse(req.body.jsondata);
            db.storeData(req.get('host'), hash, path, req.body.jsondata, function(err, numberAffected) {
                listElements(req, res, "Json stored for " + (hash ? "hash '" + hash : "path '" + path) + "'");
            })
        } catch(e) {
            res.send("Error: json data conversion failed for :\n" + req.body.jsondata);
        }
    } else {
        res.send("Error: Missing path information");
    }
}

let exportJson = function(req, res) {
    db.getSiteElements(req.params.domain, res, function(err, results) {
        let docs = results.map(data => {
            try {
                return {hash: data.hash, json: JSON.parse(data.json)}
            } catch(e) {
                res.send("Error: json data conversion failed for :\n" + data.json);
            }
        });

        res.setHeader('Content-disposition', 'attachment; filename=mirrorjson.json');
        res.set("Content-Type", "application/json");
        res.send(docs);
    });
}

exports.adminElementsImport = function(req, res) {
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        const chunks = [];

        file.on("data", function (chunk) {
            chunks.push(chunk);
        });

        file.on("end", function () {
            try {
                let jsondata = JSON.parse(chunks.join(''));
                jsondata.map(data => {
                    db.updateData(req.params.domain, data.hash, JSON.stringify(data.json));
                });

                let jsonEditorTpl = require('../templates/elementsimport.handlebars');
                let template = handlebars.compile(jsonEditorTpl.tpl());
                res.send(template({selectedDomain: req.params.domain, status: "Updated data from file " + filename}));
            } catch(err) {
                console.log(err);
                res.send("Error: json data conversion failed for :\n" + chunks.join(''));
            }
        });
    });
}

exports.adminElementsImportPage = function(req, res) {
    let jsonEditorTpl = require('../templates/elementsimport.handlebars');
    let template = handlebars.compile(jsonEditorTpl.tpl());
    res.send(template({selectedDomain: req.params.domain}));
}

exports.adminJsonEditor = function(req, res) {
    db.getElement(req.params.domain, req.params.hash, null, res, function(res, err, currentData) {
        let jsonEditorTpl = require('../templates/jsoneditor.handlebars');
        let template = handlebars.compile(jsonEditorTpl.tpl());
        res.send(template({json: currentData.json, hash: currentData.hash, domain: req.params.domain}));
    });
}

exports.adminElementsList = function(req, res) {
    if (req.body.jsondata) {
        addJson(req, res);
    } else if (req.body.export) {
        exportJson(req, res);
    } else {
        listElements(req, res);
    }
}
