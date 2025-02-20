# THIS SCRIPT CONVERT CSV EXPORTED FROM INFLUXDB 2.6 TO LINE PROTOCOL FORMAT INFLUXDB 1.8

This script is used to convert csv file exported from influxdb 2.6 to line protocol format for influxdb 1.8. The script is written in NodeJs.

## Background Problem
- My project using influxdb 2.6 as the main database
- Suddenly, the higher-ups decided to use influxdb 1.8 as the main database
- The problem is, the data in influxdb 2.6 is already huge and we need to migrate it to influxdb 1.8
- The only way to migrate the data is to export it to csv and import it to influxdb 1.8, because influxdb 2.6 doesn't have a direct way to migrate the data to influxdb 1.8
- Do you have the same problem like us ? If yes, this script can help you to convert the csv file to line protocol format.
- The catch is, this script is not automated, you need to run it manually and adjust the input file in the script
- The script is not perfect, but it can help you to convert the csv file to line protocol format

## Prerequisites
1. Nodejs installed in your machine
2. Influxdb 2.6 installed in your machine
3. Influxdb 1.8 installed in your machine
4. Curl installed in your machine

## How to use (Export data from influxdb 2.6 to csv and convert it to line protocol format)
1. Export csv file from influxdb 2.6 using curl or another http request and adjust your authentication (token, org, bucket) in the curl command below
> curl --request POST 'http://localhost:8086/api/v2/query?org=<your-org-influxdb>' \
--header 'Content-Type: application/vnd.flux' \
--header 'Accept: application/csv' \
--header 'Authorization: Token <your-token-influxdb2.6>' \
--data 'from(bucket:"<your-bucket>")
|> range(start: 0)
|> filter(fn: (r) => r._measurement == "measurement1" or r._measurement == "measurement2" or r._measurement == "measurement3")' > output_measurements.csv
2. Create folder Data & put the csv file in it
3. Adjust the inputCsv & outputLp variables in the script and # CONTEXT-DATABASE: <your-database-influxdb1.8> in the script
4. Run the script with nodejs (ex: node convert.js)
5. The output will be in the Data folder with the same name as the input file but with .lp extension

## How to use (Import data to influxdb 1.8)
1. Copy the output file from the Data folder to the influxdb 1.8 machine (ex: /home/user/output_measurements.lp)
2. Import the data to influxdb 1.8 using Influx CLI below
> influx -import -path=/home/user/output_measurements.lp -precision=s
3. Use -pps flag if you want to see the progress of the import process. For large datasets, influx writes out a status message every 100,000 points

## Note
- The script is not perfect, you need to adjust the script if you have a different csv format
- The script created suddenly because of the problem we faced, so it's not perfect.
