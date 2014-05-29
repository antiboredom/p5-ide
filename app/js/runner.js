var static = require('node-static');
var Path = require('path');
var http = require('http');
var server = null;
var templatedir = __dirname + 'base_sketch/';

function start(code, path) {
  try {
    server.close();
  } catch(e) {

  }

  if (path === null) {
    path = gui.App.dataPath + "/.tmpscript";
  }

  copyFileSync(_dirname + '/p5.js', tmpPath + 'sketch/p5.js');
  copyFileSync(__dirname + '/sketch_template.html', tmpPath + 'sketch/index.html');
  fs.writeFileSync(tmpPath + 'sketch/sketch.js', code);

  var file = new static.Server(path);
  var server = http.createServer(function (request, response) {
    request.addListener('end', function () {
      file.serve(request, response);
    }).resume();
  });
  server.listen(5000);
}
