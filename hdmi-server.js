#!/usr/local/bin/node
/*
 **
 ** hdmi-server - Small WebInterface for cec-client
 **
 */

/*
 * Server Config
 */
var host = "127.0.0.1",
    port = "8088",
    path = require("path"),
    fs = require("fs"),
    thisServerUrl = "http://" + host + ":" + port;

//define your own hdmi ports
var USER_DEFINED_HDMI_PORTS = [{ name: 'XBMC', port: 2 }];

/*
 * Functions
 */
String.format = function () {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];

    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }
    return theString;
};

/*
 * Dependencies
 */
var http = require('http'),
    url = require('url'),
    exec = require('child_process').exec;

/*
 * cec-client
 */
//Switches HDMI port => {0} port number to switch to
var CEC_SWITCH_HDMI = 'echo "tx 1f 82 {0}0 00" | cec-client -d 1 -s';
//List plugged HDMI devices
var CEC_LIST_DEVICES = 'echo "scan" | cec-client -d 1 -s';

var MODE_SWITCH = 'switch';
var MODE_LIST = 'list';
var regEx = new RegExp("#(\\d+):\\s(.*)");

/*
 * Main
 */
http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var cmd = parsedUrl.query['cmd'];

    function responseHdmiFileJSON(hdmiListFilename) {
        var readStream = fs.createReadStream(hdmiListFilename);
        var objects = new Array();
        readStream.on('data', function(data) {
            var lines = data.toString().split('\n');
            for (var i = 0; i < lines.length; ++i){
                var ccc = regEx.exec(lines[i]);
                if(ccc){
                    var object = new Object();
                    object.port = ccc[1];
                    object.name = ccc[2];
                    objects.push(object);
                }
            }
        });

        readStream.on('end', function() {
            objects = objects.concat(USER_DEFINED_HDMI_PORTS);
            res.write(JSON.stringify(objects));
            res.end();
        });
    }

    if (cmd) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        var hdmiListFilename = __dirname + "/hdmi_list.txt";
        var cmdToExecute = '';
        if(MODE_SWITCH == cmd){
            cmdToExecute = String.format(CEC_SWITCH_HDMI, parsedUrl.query['port'])
        }else if(MODE_LIST == cmd){
            cmdToExecute = CEC_LIST_DEVICES;
            var exists = path.existsSync(hdmiListFilename);
            if(!exists || (parsedUrl.query['force'] == 'true')){
                try{
                    //delete existing file
                    fs.unlinkSync(hdmiListFilename);
                }catch(e){
                    //nothing
                }
                exec(cmdToExecute, function (error, stdout, stderr) {
                    fs.writeFileSync(hdmiListFilename, stdout);
                    responseHdmiFileJSON(hdmiListFilename);
                });
            }else{
                responseHdmiFileJSON(hdmiListFilename);
            }
        }else{
            //no matching comand
            console.error("Command not found: " + cmd);
            res.end();
            return;
        }
        exec(cmdToExecute, function (error, stdout, stderr) {
            var result = '{"stdout":' + stdout + ',"stderr":"' + stderr + '","cmd":"' + cmd + '"}';
            res.write(result + '\n');
        });
        res.end();
    } else {
        var uri = url.parse(req.url).pathname
            , filename = path.join(__dirname, uri);

        path.exists(filename, function(exists) {
            if(!exists) {
                res.writeHead(404, {"Content-Type": "text/plain"});
                res.write("404 Not Found\n");
                res.end();
                return;
            }

            if (fs.statSync(filename).isDirectory()) filename += '/index.html';

            fs.readFile(filename, "binary", function(err, file) {
                if(err) {
                    res.writeHead(500, {"Content-Type": "text/plain"});
                    res.write(err + "\n");
                    res.end();
                    return;
                }
                res.writeHead(200);
                res.write(file, "binary");
                res.end();
            });
        });
    }
}).listen(port, host);
console.log('Server running at ' + thisServerUrl);