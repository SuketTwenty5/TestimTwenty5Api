// routes/testResults.js
const express = require('express');
const router = express.Router();
const JSONDBFSDriver = require('jsondbfs'); // Ensure you have this package installed
const { exec } = require('child_process');

// JSONDBFS Configuration
let database;
const driver = 'disk';
const path = '.';
const options = {
    path: path,
    driver: driver,
};
const collectionName = 'TestResults';

function getCount(database, collectionName) {
    return new Promise((resolve) => {
        database[collectionName].count((err, count) => {
            if (err) {
                console.error('Error counting documents:', err);
                resolve(0);
            } else {
                console.log('count', count);
                resolve(count);
            }
        });
    });
}

function insertResults(database, collectionName, rowData) {
    return new Promise((resolve) => {
        database[collectionName].update({ "resultId": rowData.ResultID }, rowData, { upsert: true, multi: true, retObj: true }, (err, document) => {
            if (err) {
                console.error('Error inserting document:', err);
                resolve(null);
            } else {
                resolve(document);
            }
        });
    });
}

function runReportScript(resultID) {
    return new Promise((resolve, reject) => {
        // Pass ResultID as an argument to the script
        exec(`node testim-test-result-report-generate.js ${resultID}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
                reject(new Error(stderr));
                return;
            }
            console.log(`Script stdout: ${stdout}`);
            resolve(stdout);
        });
    });
}

// POST endpoint to receive data
router.post('/log-test-results', (req, res) => {
    const {
        TestName,
        TestRunDate,
        Branch,
        BaseURL,
        TestStatus,
        TestStatusDetails,
        ProjectID,
        TestID,
        ResultID,
        ResultURL,
        TestResultsJSON,
        TestDataJSON,
        TestPerformanceJSON,
        NetworkRequestStats,
        _stepData,
        _stepInternalData,
        Steps
    } = req.body;

    const resultData = {
        "TestName": TestName,
        "TestRunDate": TestRunDate,
        "Branch": Branch,
        "BaseURL": BaseURL,
        "TestStatus": TestStatus,
        "TestStatusDetails": TestStatusDetails,
        "ProjectID": ProjectID,
        "TestID": TestID,
        "ResultID": ResultID,
        "ResultURL": ResultURL,
        "TestResultsJSON": TestResultsJSON,
        "TestDataJSON": TestDataJSON,
        "TestPerformanceJSON": TestPerformanceJSON,
        "NetworkRequestStats": NetworkRequestStats,
        "_stepData": _stepData,
        "_stepInternalData": _stepInternalData,
        "Steps": Steps,
    };

    console.log(resultData);

    JSONDBFSDriver.connect([collectionName], options, (err, db) => {
        if (err) {
            console.error('Error connecting to database:', err);
            res.status(500).send('Database connection error');
            return;
        }

        database = db;
        insertResults(database, collectionName, resultData)
            .then((document) => {
                return getCount(database, collectionName);
            })
            .then((count) => {
		console.log(ResultID);
                // Pass ResultID to the script when calling runReportScript
                return runReportScript(ResultID);
            })
            .then((reportOutput) => {
                res.status(200).send({ reportOutput: reportOutput });
            })
            .catch((error) => {
                console.error('Error processing request:', error);
                res.status(500).send('Internal server error');
            });
    });
});

module.exports = router;
