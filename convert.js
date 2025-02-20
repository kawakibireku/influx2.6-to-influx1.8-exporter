const fs = require('fs');
const readline = require('readline');
const { Transform } = require('stream');

const inputCsv = './data/data-waterlevel.csv';
const outputLp = './data/data-waterlevel.lp';

// Create write stream instead of storing everything in memory
const writeStream = fs.createWriteStream(outputLp);

// Write headers
writeStream.write('# DML\n');
writeStream.write('# CONTEXT-DATABASE: saas\n');
writeStream.write('# CONTEXT-RETENTION-POLICY: autogen\n\n');

// Create transform stream for processing chunks
const transformStream = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  },
});

let headers = [];
let isDataSection = false;
let processedLines = 0;
const batchSize = 10000; // Process 10000 lines at a time
let batch = [];

const readStream = fs.createReadStream(inputCsv, {
  highWaterMark: 64 * 1024, // 64KB buffer size
  encoding: 'utf8',
});

const rl = readline.createInterface({
  input: readStream.pipe(transformStream),
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  // Skip empty lines and metadata headers
  if (!line || line.startsWith('#')) return;

  try {
    // Split the line by comma, but handle empty fields
    const values = line.split(',').map((v) => v.trim());

    if (!isDataSection) {
      headers = values.map((h) => h || '');
      isDataSection = true;
      return;
    }

    // Skip if not enough values
    if (values.length < headers.length) return;

    // Map values to corresponding headers
    const row = {};
    headers.forEach((key, index) => {
      if (key) row[key] = values[index] || '';
    });

    // Skip if missing required fields
    if (
      !row['_measurement'] ||
      !row['_field'] ||
      !row['_value'] ||
      !row['_time']
    )
      return;

    // Convert timestamp to nanoseconds
    const timestamp = new Date(row['_time']).getTime() * 1000000;

    // Format the line protocol
    const lineProtocol = `${row['_measurement']},deviceId=${row['deviceId']},platformId=${row['platformId']} ${row['_field']}=${row['_value']} ${timestamp}\n`;

    batch.push(lineProtocol);
    processedLines++;

    // Write batch when it reaches the batch size
    if (batch.length >= batchSize) {
      writeStream.write(batch.join(''));
      batch = [];

      // Log progress
      if (processedLines % 100000 === 0) {
        console.log(`Processed ${processedLines.toLocaleString()} lines...`);
      }
    }
  } catch (error) {
    console.error(`Error processing line: ${line}`);
    console.error(error);
  }
});

rl.on('close', () => {
  // Write remaining batch
  if (batch.length > 0) {
    writeStream.write(batch.join(''));
  }

  writeStream.end();
  console.log(
    `✅ Conversion complete! ${processedLines.toLocaleString()} lines processed`,
  );
});

writeStream.on('finish', () => {
  console.log('✅ File write completed successfully');
});

rl.on('error', (error) => {
  console.error('Error reading file:', error);
});

writeStream.on('error', (error) => {
  console.error('Error writing file:', error);
});
