# Testing

## Frontend

### Test Runner

Frontend tests use [Jest](https://jestjs.io/) with [jest-preset-angular](https://thymikee.github.io/jest-preset-angular/). **`npm test` (Jest) is the supported test runner** for all frontend specs.

> **Note:** The Angular CLI `test` target in `angular.json` is still configured for Karma/Jasmine. Running `ng test` will use Karma and will **not** work with the Jest-based specs in this project. Always use `npm test` (or the explicit `npm run test:jest`) to run frontend tests.

### Frontend CLI

From the `frontend/` directory:

```bash
# Run all frontend tests (Jest)
npm test

# Equivalent explicit alias
npm run test:jest

# Run with coverage report
npm run test:coverage

# Run Karma/Jasmine via Angular CLI (not supported for the Jest specs)
npm run test:karma
```

To run a specific spec file:

```bash
npm test -- --testPathPatterns="office-hours"
```

### Test Organization

Frontend tests live under `frontend/src/app/test/` and are co-located by feature area (e.g. `office-hours/`, `coworking/`, `academics/`, `applications/`).

---

## Backend

### Organization

Tests for `backend` code use [Pytest](https://doc.pytest.org/) and are organized in the `backend/test` directory
with subdirectories that mirror the package structure.

The file `backend/test/conftest.py` defines fixtures for automatically setting up and tearing down a test database for backend services to use.

### Pytest CLI

The `pytest` command-line program will run all tests in the command-line.

To see `print` output, run Pytest with the special extra output flag `pytest -rP`.

To limit the scope of your tests to a specific file, include the path to the file following the command, eg:

`pytest backend/test/services/user_test.py`

To run a specific test within a test suite, use the [`-k` option of `pytest`](https://docs.pytest.org/en/latest/example/markers.html#using-k-expr-to-select-tests-based-on-their-name) to match all or part of the filtered test name(s):

`pytest backend/test/services/user_test.py -k test_get`

### Pytest VSCode with Debugger

VSCode's Python plugin has great support for testing. Click the test tube icon, configure VSCode to use Pytest and select the workspace. 

When you refresh, you will see tests you can run individually, or in the debugger and with breakpoints. When you encounter a bug or failing test and having a difficult time pinning down exactly why it is failing, developing the instinct to run the test in the VSCode debugger, setting a break point, and stepping through is encouraged.

For more, see the [official documentation](https://code.visualstudio.com/docs/python/testing).

### Code Coverage

We expect 100% test coverage of backend services code and as much coverage for other code in the backend. 

To generate a test coverage report, run the following command in your development container:

`pytest --cov-report html:coverage --cov=backend/services backend/test/services`

This command generates a directory with an HTML report. To view it, on your _host machine_, open the `coverage` directory's `index.html` file. Click on the service file you are working on to see the lines not covered by test cases if you are below 100%. After adding test cases that cover the missing lines, rerun the coverage command to generate a new report and confirm your progress.