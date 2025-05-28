const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Initialize the store
const store = new Store();

// Log application details for debugging
console.log('App starting...');
console.log('App path:', app.getAppPath());
console.log('Is dev mode:', isDev);

// Set custom user data directory to avoid permission issues
const userDataPath = path.join(app.getPath('documents'), 'LogisticsCalculator');
console.log('Using custom user data path:', userDataPath);
app.setPath('userData', userDataPath);

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show until content is loaded to avoid blank window flashing
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Always open DevTools in both dev and production to help with debugging
    mainWindow.webContents.openDevTools();
  });

  // Determine the correct index.html location
  let indexPath;
  if (isDev) {
    // In development mode, load from React dev server
    indexPath = 'http://localhost:3000';
    console.log('Loading from dev server:', indexPath);
  } else {
    // In production mode, look for the index.html file
    console.log('Searching for index.html in these locations:');
    
    // Try multiple possible paths to find the index.html
    const possiblePaths = [
      path.join(app.getAppPath(), 'build', 'index.html'),
      path.join(__dirname, '../build/index.html'),
      path.join(process.resourcesPath, 'app.asar/build/index.html'),
      path.join(process.resourcesPath, 'app.asar', 'build', 'index.html'),
      path.join(process.resourcesPath, 'app/build/index.html'),
      path.join(process.resourcesPath, 'build/index.html')
    ];
    
    let foundPath = null;
    
    for (const testPath of possiblePaths) {
      try {
        const exists = fs.existsSync(testPath);
        console.log(`- ${testPath}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
        if (exists) {
          foundPath = testPath;
          break;
        }
      } catch (err) {
        console.log(`- ${testPath}: ERROR ${err.message}`);
      }
    }
    
    if (foundPath) {
      indexPath = `file://${foundPath}`;
      console.log('Found index.html at:', foundPath);
    } else {
      console.error('Could not find index.html file in any location!');
      
      // Show an error page instead
      indexPath = `data:text/html,
        <html>
          <head>
            <title>Error Loading App</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; color: #333; text-align: center; }
              .container { max-width: 800px; margin: 50px auto; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #e74c3c; }
              pre { background: #f8f8f8; padding: 10px; border-radius: 3px; overflow: auto; text-align: left; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Application Error</h1>
              <p>The application could not find the main UI files.</p>
              <p>App path: ${app.getAppPath()}</p>
              <p>Resource path: ${process.resourcesPath}</p>
              <p>Current directory: ${__dirname}</p>
            </div>
          </body>
        </html>`;
    }
  }

  // Load the URL
  console.log('Loading URL:', indexPath);
  mainWindow.loadURL(indexPath);

  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    mainWindow.loadURL(`data:text/html,
      <html>
        <head>
          <title>Loading Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; color: #333; text-align: center; }
            .container { max-width: 800px; margin: 50px auto; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Loading Error</h1>
            <p>Error code: ${errorCode}</p>
            <p>Description: ${errorDescription}</p>
          </div>
        </body>
      </html>`);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-data', (event, key) => { 
  return store.get(key);
});

ipcMain.handle('set-data', (event, key, value) => {
  store.set(key, value);
  return true;
}); 