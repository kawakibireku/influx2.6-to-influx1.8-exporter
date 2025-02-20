const fs = require('fs');
const readline = require('readline');

const inputCsv = './data/data-waterlevel.csv';
const outputLp = './data/data-waterlevel.lp';

const results = [
  '# DML',
  '# CONTEXT-DATABASE: saas',
  '# CONTEXT-RETENTION-POLICY: autogen',
  '', // Empty line after headers
];

const readStream = fs.createReadStream(inputCsv);
const rl = readline.createInterface({ input: readStream });

let headers = [];
let isDataSection = false;

rl.on('line', (line) => {
  // Skip empty lines and metadata headers
  if (!line || line.startsWith('#')) return;

  // Split the line by comma, but handle empty fields
  const values = line.split(',').map((v) => v.trim());

  if (!isDataSection) {
    headers = values.map((h) => h || ''); // Store column names
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
  if (!row['_measurement'] || !row['_field'] || !row['_value'] || !row['_time'])
    return;

  try {
    // Convert timestamp to nanoseconds
    const timestamp = new Date(row['_time']).getTime() * 1000000;

    // Format the line protocol
    const lineProtocol = `${row['_measurement']},deviceId=${row['deviceId']},platformId=${row['platformId']} ${row['_field']}=${row['_value']} ${timestamp}`;

    results.push(lineProtocol);
  } catch (error) {
    console.error(`Error processing line: ${line}`);
    console.error(error);
  }
});

rl.on('close', () => {
  if (results.length > 0) {
    fs.writeFileSync(outputLp, results.join('\n'));
    console.log(
      `✅ Conversion complete! ${results.length} lines written to 'data.lp'`,
    );
  } else {
    console.log('⚠️ No valid data points were processed');
  }
});

rl.on('error', (error) => {
  console.error('Error reading file:', error);
});
