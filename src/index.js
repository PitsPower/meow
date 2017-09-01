var {app, BrowserWindow} = require('electron');
//require('electron-debug')();

app.on('ready', function() {
	var mainWindow = new BrowserWindow({
		backgroundColor: '#2f3036',
		width: 1280,
		height: 720,
		frame: false
	});
	
	mainWindow.loadURL('file://'+__dirname+'/views/index.html');
	mainWindow.setMenu(null);
	mainWindow.maximize();
	
	BrowserWindow.addDevToolsExtension('ext/react');
	mainWindow.openDevTools();
});

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});