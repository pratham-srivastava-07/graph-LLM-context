const path = require('path');
const fs = require('fs');

console.log('Current directory:', __dirname);
console.log('Looking for sap-o2c-data at:', path.join(__dirname, '../../sap-o2c-data'));
console.log('Exists:', fs.existsSync(path.join(__dirname, '../../sap-o2c-data')));

const dataDir = path.join(__dirname, '../../sap-o2c-data');
if (fs.existsSync(dataDir)) {
  console.log('Contents:', fs.readdirSync(dataDir));
} else {
  console.log('Trying backend/sap-o2c-data:', path.join(__dirname, '../../../backend/sap-o2c-data'));
  const altDir = path.join(__dirname, '../../../backend/sap-o2c-data');
  console.log('Alternative exists:', fs.existsSync(altDir));
  if (fs.existsSync(altDir)) {
    console.log('Alternative contents:', fs.readdirSync(altDir));
  }
}
