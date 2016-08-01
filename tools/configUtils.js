var fs = require('fs');
var path = require('path');

var cfgFileName = 'session-config.js';
var sessionConfig = require('./session-config');
var cache = {};

module.exports.getConfigs = function(){
    if (!cache[cfgFileName]) {
        // console.log("process.env.cloudDriveConfig: "+process.env.cloudDriveConfig);
        if (!process.env.cloudDriveConfig) {
            process.env.cloudDriveConfig = path.join(process.cwd(), cfgFileName);
            // console.log(path.join(process.cwd(), cfgFileName));
            // console.log(process.env.cloudDriveConfig);
        }
        // console.log("fs.existsSync(process.env.cloudDriveConfig): "+fs.existsSync(process.env.cloudDriveConfig));
        if (fs.existsSync(process.env.cloudDriveConfig)) {
            // console.log("sessionConfig: "+sessionConfig);
            var contents = sessionConfig;
            // var contents = fs.readFileSync(
            //     process.env.cloudDriveConfig, {encoding: 'utf-8'});
            cache[cfgFileName] = contents;
        }
    }
    return cache[cfgFileName];
}