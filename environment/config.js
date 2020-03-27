var fs = require("fs");
var path = require("path");

var localFileDir = `${__dirname}/../config/`;
const normolizePath = path.normalize(localFileDir);

if (fs.existsSync(normolizePath + 'local@example.json')) {
    var config = require(normolizePath + "local@example.json");
    for(var key in config) {
        process.env[key] = config[key];
        // console.log('\nSet environment name: ', key, ", value: ", config[key]);
    }
    console.log('\nEnvironment variable set for local from environment/config.js.\n');
}