var gui = require('nw.gui');
var Path = require('path');
var util = require('util');

var modes = {
  ".html": "html",
  ".htm": "html",
  ".js": "javascript",
  ".css": "css",
  ".json": "json",
  ".txt": "text",
};

function Editor(projectPath) {
  this.openedFiles = {};
  this.fileBuffer = {};
  this.projectPath = projectPath;

  this.window = gui.Window.get();
  this.ace = window.ace;
  this.editor = ace.edit("editor");
  this.editorSession = this.editor.getSession();
  this.editorSession.setMode("ace/mode/javascript");
  this.editor.setShowPrintMargin(false);
  this.editor.focus();

  this.previousFile = null;

  var self = this;

  this.editor.on('change', function() {
    self.fileBuffer[self.filePath] = self.editor.getValue();
    if (self.openedFiles[self.filePath] != self.fileBuffer[self.filePath]) {
      self.window.title = (self.currentFile || 'Untitled') + ' *';
    } else {
      self.window.title = self.currentFile || 'Untitled';
    }
  });

  this.outputWin = null;
  this.filePath = null;

  this.openProject();
  this.setShortCuts();
}

Editor.prototype.openProject = function() {
  this.fileTree = new FileTree(this.projectPath, this);
  for (var i = 0; i < this.fileTree.files.length; i++) {
    var f = this.fileTree.files[i];
    if (f.label == 'sketch.js') {
      this.openFile(f.path);
    }
  }
};

Editor.prototype.openFile = function(path) {
  var self = this;

  self.previousFile = self.filePath;
  self.filePath = path;
  self.editor.setReadOnly(true);

  if (self.fileBuffer[path]) {
    self.editor.setReadOnly(false);
    self.editor.setValue(self.fileBuffer[path], -1);
    self.handleFileChange();
  } else {
    fs.readFile(path, "utf8", function(err, file) {
      self.editor.setReadOnly(false);
      self.editor.setValue(file, -1);
      self.openedFiles[path] = file;
      self.fileBuffer[path] = file;
      self.handleFileChange();
    });
  }
};

Editor.prototype.handleFileChange = function() {
  this.getCurrentFilename();
  this.setTitle();
  this.mode = this.detectType(this.filePath);
  this.editor.getSession().setMode("ace/mode/" + this.mode);
  this.editor.focus();
};

Editor.prototype.getCurrentFilename = function() {
  var p = this.filePath.split("/");
  this.currentFile = p[p.length-2] + "/" + p[p.length-1];
  return this.currentFile;
};

Editor.prototype.setTitle = function() {
  this.window.title = this.currentFile;
  if (this.openedFiles[this.filePath] != this.fileBuffer[this.filePath]) {
    this.window.title = this.currentFile + ' *';
  } else {
    this.window.title = this.currentFile;
  }
};

Editor.prototype.writeFile = function() {
  var self = this;
  fs.writeFile(this.filePath, this.editor.getValue(), "utf8", function(err) {
    self.handleFileChange();
    //add error handling
  });
}


Editor.prototype.detectType = function(path) {
  var ext = Path.extname(path);
  return modes[ext] || "text";
}

Editor.prototype.saveFile = function() {
  if (this.filePath === null) {
    this.openSaveDialog();
  } else {
    this.writeFile();
    this.openedFiles[this.filePath] = this.fileBuffer[this.filePath];
  }
};

Editor.prototype.saveFileAs = function() {
  this.openSaveDialog();
};

Editor.prototype.openSaveDialog = function() {
  var self = this;
  var chooser = $('#saveFile');
  chooser.trigger('click');
  chooser.change(function(evt) {
    if ($(this).val()) {
      var saveFilename = $(this).val();
      self.filePath = saveFilename;
      self.writeFile();
    }
  });
};

Editor.prototype.newFile = function() {
  var self = this;
  var chooser = $('#saveFile');
  chooser.trigger('click');
  chooser.change(function(evt) {
    if ($(this).val()) {
      var saveFilename = $(this).val();
      fs.writeFile(saveFilename, '', "utf8", function(err) {
        self.openFile(saveFilename);
      });
    }
  });
};

Editor.prototype.newProject = function() {
  global.$saveFile.trigger('click');
  global.splash.hide();
};

Editor.prototype.openProjectFolder = function() {
  global.$openFile.trigger('click');
};

Editor.prototype.close = function() {

};

Editor.prototype.run = function() {
  var self = this;
  this.saveFile();
  if (this.outputWin == null) {
    this.outputWin = gui.Window.open('file://' + this.projectPath + '/index.html', {
      focus: true,
      x: this.window.x + 100,
      y: this.window.y + 100,
      //'inject-js-start': 'js/errors.js'
    });

    this.outputWin.on('loaded', function() {
      this.window.onerror = function (msg, url, num) {
        $('#debug').append('<pre class="error">Line ' + num + ': ' + msg + '</pre>');
        $('#debug').scrollTop($('#debug')[0].scrollHeight);
      };

      var original = this.window.console;
      this.window.console = {
        log: function(val){
          $('#debug').append('<pre>' + util.inspect(val) + '</pre>');
          $('#debug').scrollTop($('#debug')[0].scrollHeight);
          original.log.apply(original, arguments)
        },
        warn: function(val){
          $('#debug').append('<div>' + util.inspect(val) + '</div>');
          $('#debug').scrollTop($('#debug')[0].scrollHeight);
          original.warn.apply(original, arguments)
        },
        error: function(val){
          $('#debug').append('<div>' + util.inspect(val) + '</div>');
          $('#debug').scrollTop($('#debug')[0].scrollHeight);
          original.error.apply(original, arguments)
        }
      }
    });

    this.outputWin.on("close", function(){
      this.close(true);
      self.outputWin = null;
    });
  } else {
    this.outputWin.reloadIgnoringCache();
    this.outputWin.focus();
  }
};

Editor.prototype.setShortCuts = function() {
  var self = this;
  self.editor.commands.addCommand({
      name: 'Run',
      bindKey: {mac: "Command-R", win: "Ctrl-R"},
      exec: function(editor) {
        self.run();
      }
  });

  self.editor.commands.addCommand({
      name: 'Open',
      bindKey: {mac: "Command-O", win: "Ctrl-O"},
      exec: function(editor) {
        self.openFile();
      }
  });

  self.editor.commands.addCommand({
      name: 'Open Project',
      bindKey: {mac: "Command-Shift-O", win: "Ctrl-Shift-O"},
      exec: function(editor) {
        self.openProjectFolder();
      }
  });

  self.editor.commands.addCommand({
      name: 'Save',
      bindKey: {mac: "Command-S", win: "Ctrl-S"},
      exec: function(editor) {
        self.saveFile();
      }
  });

  self.editor.commands.addCommand({
      name: 'Save As',
      bindKey: {mac: "Command-Shift-S", win: "Ctrl-Shift-S"},
      exec: function(editor) {
        self.saveFileAs();
      }
  });

  self.editor.commands.addCommand({
      name: 'New',
      bindKey: {mac: "Command-N", win: "Ctrl-N"},
      exec: function(editor) {
        self.newFile();
      }
  });

  self.editor.commands.addCommand({
      name: 'New Project',
      bindKey: {mac: "Command-Shift-N", win: "Ctrl-Shift-N"},
      exec: function(editor) {
        self.newProject();
      }
  });

  self.editor.commands.addCommand({
      name: 'Close',
      bindKey: {mac: "Command-W", win: "Ctrl-W"},
      exec: function(editor) {
        self.close();
      }
  });

  self.editor.commands.addCommand({
    name: "devtool",
    bindKey: {win: "Alt-Ctrl-J", mac: "Alt-Command-J"},
    exec: function() {
      self.window.showDevTools();
    }
  });

  //self.window.on("devtools-opened", function(url) {
    //console.log("devtools-opened: " + url);
    //$('#debug-frame')[0].src = url;
  //});

  var menubar = new gui.Menu({ type: 'menubar' });
  var fileMenu = new gui.Menu();

  fileMenu.append(new gui.MenuItem({ label: 'New \t\t\u2318N', click: function(){
    self.newFile();
  }}));

  fileMenu.append(new gui.MenuItem({ label: 'Open \t\t\u2318O', click: function(){
    self.openFile();
  }}));

  fileMenu.append(new gui.MenuItem({ label: 'Close \t\t\u2318W', click: function(){
    self.closeFile();
  }}));

  fileMenu.append(new gui.MenuItem({ label: 'Save \t\t\u2318S', click: function(){
    self.saveFile();
  }}));

  fileMenu.append(new gui.MenuItem({ label: 'Save As \t\t\u21E7\u2318S', click: function(){
    self.saveFileAs();
  }}));

  fileMenu.append(new gui.MenuItem({ type: 'separator' }));

  fileMenu.append(new gui.MenuItem({ label: 'Save & Run \t\u2318R', click: function(){
    self.run();
  }}));

  var help = new gui.Menu();
  this.window.menu = menubar;
  this.window.menu.insert(new gui.MenuItem({ label: 'File', submenu: fileMenu}), 1);
  this.window.menu.append(new gui.MenuItem({ label: 'Help', submenu: help}));

}

$('#drag').on('mousedown', function(e){
  var $dragable = $(this).parent(),
  handleHeight = $(this).height(),
  startHeight = $dragable.height(),
  pY = e.pageY;

  $(document).on('mouseup', function(e){
    $(document).off('mouseup').off('mousemove');
  });

  $(document).on('mousemove', function(me){
    var my = (me.pageY - pY);
    if (startHeight - my >= handleHeight) {
      $dragable.css({ height: startHeight - my });
      editor.editor.resize();
    }
  });
});

