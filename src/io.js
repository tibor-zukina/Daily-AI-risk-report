import fs from 'fs';
import path from 'path';
import { _log, _error } from './logging.js';
import { currentDate } from './utils.js';

function getFullPath(filePath) {

  return path.resolve(filePath);
}

export function getBaseDir() {

  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');  // root folder where index.js is
}

export function createDataDirectories() {

  _log('Checking and creating data directories');

  const baseDir = getBaseDir();
  const dataDir = path.join(baseDir, 'data');

  const dirs = [
    dataDir,
    path.join(dataDir, 'risks'),
    path.join(dataDir, 'queries'),
    path.join(dataDir, 'news'),
    path.join(dataDir, 'report')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      _log(`Created directory: ${dir}`);
    }
  });
}

export async function readFromFile(filePath) {
  const fullPath = getFullPath(filePath);
  _log(`Reading from file ${fullPath}`);

  try {
    const data = await fs.promises.readFile(fullPath, 'utf-8');
    return data;
  } catch (err) {
    throw new Error(`Failed to read file ${fullPath}: ${err.message}`);
  }
}

export function writeToFile(filePath, content) {

  const fullPath = getFullPath(filePath);
  _log(`Writing to file ${fullPath}`);

  fs.writeFileSync(fullPath, content, "utf8");

}

export function getDataFilename(dataType, fileType) {

  return getFullPath(`../data/${dataType}/${currentDate('_')}_${dataType}.${fileType}`);
}

export function saveData(content, dataType, fileType) {

   const filename = getDataFilename(dataType, fileType);
   _log(`Saving ${dataType} to ${filename}`);
   writeToFile(filename, content);

   return filename;
}

