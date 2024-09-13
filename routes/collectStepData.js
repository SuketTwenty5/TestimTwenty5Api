const express = require('express');
const router = express.Router();

// Utility function to parse JSON safely
function tryParseJSONObject(jsonString) {
    try {
        let o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) {
        console.log(e);
    }
    return null;
}

// Extracts test variables from session storage and other arguments
function testimVariablesGet(args) {
    function getParams() {
        return Object.keys(args);
    }

    let _test_variables = {};
    let arg_names = getParams();

    for (let a = 0; a < arg_names.length; a++) {
        let arg = arg_names[a];
        switch (arg) {
            case "context":
            case "exports":
            case "exportsGlobal":
            case "exportsTest":
            case "test_variables":
            case "test_variables_log":
            case "_test_data":
            case "_stepData":
            case "_stepInternalData":
            case "_steps":
            case "testVariablesDefined":
            case "testVariablesWithValues":
            case "transactions":
            case "BASE_URL":
                break;
            default:
                _test_variables[arg] = args[arg];
                break;
        }
    }

    return _test_variables;
}

// Route to handle step data collection
router.post('/collect-step-data', (req, res) => {
    const { _stepData, _stepInternalData, sessionStorage } = req.body;

    // Initialize steps if not already defined
    let exportsTest = { _steps: [] };

    // Combine step data
    let step = Object.assign({}, _stepData, _stepInternalData);
    step['stepNumber'] = exportsTest._steps.length + 1;
    step['endTime'] = Date.now();
    step['status'] = (typeof _stepInternalData.failureReason === 'undefined') ? "PASSED" : "FAILED";

    step['hostname'] = req.hostname;
    step['page'] = req.protocol + '://' + req.get('host') + req.originalUrl;
    step['pathname'] = req.originalUrl;
    step['protocol'] = req.protocol;

    // Collect session storage data
    let testdata = {};
    if (sessionStorage) {
        Object.keys(sessionStorage).forEach(key => {
            let session_result = tryParseJSONObject(sessionStorage[key]);
            if (session_result && session_result.exportsTest) {
                Object.keys(session_result.exportsTest).forEach(exportKey => {
                    if (!["test_variables", "_test_data", "_stepData", "_stepInternalData", "_steps", "testVariablesDefined", "testVariablesWithValues", "transactions"].includes(exportKey)) {
                        try {
                            testdata[exportKey] = session_result.exportsTest[exportKey];
                        } catch (error) {
                            console.log(error);
                        }
                    }
                });
            }
        });
    }

    step['testdata'] = { ...testdata, ...testimVariablesGet(req.body) };
    exportsTest._steps.push(step);

    res.json({ message: 'Step data collected successfully', step: step });
});

module.exports = router;
