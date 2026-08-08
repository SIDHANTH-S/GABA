const { app, BrowserWindow, protocol } = require('electron');
app.whenReady().then(() => {
  protocol.registerStringProtocol('gaba', (request, callback) => {
    callback({ mimeType: 'text/html', data: '<html><body>GABA protocol</body></html>' });
  });
  const win = new BrowserWindow();
  win.loadURL('gaba://newtab');
});
