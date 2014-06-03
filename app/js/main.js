var fs = require('fs');
var Path = require('path');
var gui = require('nw.gui');

var splash = gui.Window.get();
var windowCount = 0;
var $openFile = $("#openFile");
var $saveFile = $('#saveFile');

global.splash = splash;
global.$openFile = $openFile;
global.$saveFile = $saveFile;

$('#open').click(function() {
  $openFile.trigger('click');
});

$('#new').click(function() {
  $saveFile.trigger('click');
});

$saveFile.change(function(evt) {
  if ($(this).val()) {
    createProject($(this).val());
  }
});

$openFile.change(function(evt) {
  openProject(this.files[0].path);
});

function createProject(path) {
  if (path === null) return false;
  var basename = Path.basename(path);
  var dirname = Path.dirname(path);
  var sketchTemplate = Path.dirname(window.location.pathname) + '/base_sketch/';
  fs.mkdirSync(path);
  copyFileSync(sketchTemplate + 'p5.js', path + '/p5.js');
  copyFileSync(sketchTemplate + 'index.html', path + '/index.html');
  fs.writeFileSync(path + '/sketch.js', '');
  openProject(path);
}

function openProject(path) {
  windowCount ++;
  splash.hide();

  var win = gui.Window.open('editor.html?path=' + path, {
    position: 'center',
    width: 800,
    height: 800,
    toolbar: false,
    focus: true
  });

  win.on('close', function(){
    $openFile.val('');
    $saveFile.val('');
    windowCount --;
    if (windowCount === 0) {
      splash.show();
    }
    this.close(true);
  });

}

function copyFileSync(srcFile, destFile, encoding) {
  var content = fs.readFileSync(srcFile, encoding);
  fs.writeFileSync(destFile, content, encoding);
}

