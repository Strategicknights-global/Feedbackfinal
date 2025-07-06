// importSubjects.js (ES Module Version)

import admin from 'firebase-admin';
import fs from 'fs';
import csv from 'csv-parser';
import { createRequire } from 'module';

// A small workaround to import a JSON file in ES Modules
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const subjectsCollection = db.collection('subjects');

fs.createReadStream('subjects.csv')
  .pipe(csv())
  .on('data', async (row) => {
    try {
      // Make sure to convert semester to a number
      row.semester = parseInt(row.semester, 10);
      await subjectsCollection.add(row);
      console.log(`Added subject: ${row.name}`);
    } catch (error) {
      console.error(`Error adding subject ${row.name}: `, error);
    }
  })
  .on('end', () => {
    console.log('CSV file successfully processed.');
    // It's good practice to exit the script after it's done
    process.exit(0);
  });