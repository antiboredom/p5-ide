var gui = require('nw.gui');
var win = gui.Window.get();
var menubar = new gui.Menu({ type: 'menubar' });
var fileMenu = new gui.Menu();

fileMenu.append(new gui.MenuItem({ label: 'New \t\t\u2318N', click: function(){
  newFile();
}}));

fileMenu.append(new gui.MenuItem({ label: 'Open \t\t\u2318O', click: function(){
  openFile();
}}));

fileMenu.append(new gui.MenuItem({ label: 'Close \t\t\u2318W', click: function(){
  closeFile();
}}));

fileMenu.append(new gui.MenuItem({ label: 'Save \t\t\u2318S', click: function(){
  saveFile();
}}));

fileMenu.append(new gui.MenuItem({ label: 'Save As \t\t\u21E7\u2318S', click: function(){
  saveFileAs();
}}));

fileMenu.append(new gui.MenuItem({ type: 'separator' }));

fileMenu.append(new gui.MenuItem({ label: 'Run \t\t\u2318R', click: function(){
  runCode(path);
}}));

var help = new gui.Menu();
win.menu = menubar;
win.menu.insert(new gui.MenuItem({ label: 'File', submenu: fileMenu}), 1);
win.menu.append(new gui.MenuItem({ label: 'Help', submenu: help}));


