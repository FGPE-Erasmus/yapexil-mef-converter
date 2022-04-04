const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { tmpdir } = require("os");
const unzipper = require("unzipper");
const { yapexil2mef } = require("../src");

describe("YAPExIL to MEF conversion.", () => {
  const nrOfRuns = 1000;
  const executionTimes = {};
  const cleanup = [];

  beforeAll(() => {});

  afterAll(() => {
    for (const obj of cleanup) {
      fs.rmSync(obj);
    }
    Object.keys(executionTimes).forEach((type) =>
      console.log(executionTimes[type].join("\n"))
    );
  });

  test("should convert BLANK_SHEET_MULTIPLE_STATEMENTS A", async () => {
    executionTimes.BLANK_SHEET_MULTIPLE_STATEMENTS = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("blank-sheet-multiple-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/BLANK_SHEET_MULTIPLE_STATEMENTS/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.BLANK_SHEET_MULTIPLE_STATEMENTS.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/BLANK_SHEET_MULTIPLE_STATEMENTS/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });

  test("should convert BLANK_SHEET A", async () => {
    executionTimes.BLANK_SHEET = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("blank-sheet-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/BLANK_SHEET/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.BLANK_SHEET.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/BLANK_SHEET/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });

  test("should convert EXTENSION A", async () => {
    executionTimes.EXTENSION = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("extension-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/EXTENSION/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.EXTENSION.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/EXTENSION/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });

  test("should convert IMPROVEMENT A", async () => {
    executionTimes.IMPROVEMENT = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("improvement-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/IMPROVEMENT/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.IMPROVEMENT.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/IMPROVEMENT/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });

  test("should convert BUG_FIX A", async () => {
    executionTimes.BUG_FIX = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("bug-fix-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/BUG_FIX/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.BUG_FIX.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/BUG_FIX/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });

  test("should convert FILL_IN_GAPS A", async () => {
    executionTimes.FILL_IN_GAPS = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("fill-in-gaps-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/FILL_IN_GAPS/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.FILL_IN_GAPS.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/FILL_IN_GAPS/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });

  test("should convert SORT_BLOCKS A", async () => {
    executionTimes.SORT_BLOCKS = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("sort-blocks-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/SORT_BLOCKS/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.SORT_BLOCKS.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/SORT_BLOCKS/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });

  test("should convert SPOT_BUG A", async () => {
    executionTimes.SPOT_BUG = [];

    // convert to MEF format and write results to temp file
    let temp;

    for (let i = 0; i < nrOfRuns; i++) {
      temp = tempFile("spot-bug-" + i + "-", ".zip");
      const startTime = process.hrtime();
      await yapexil2mef("./test/SPOT_BUG/A.zip", temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));
      executionTimes.SPOT_BUG.push(elapsedTime);
      cleanup.push(temp);
    }

    // read expected zip to in-memory buffer
    const expectedZip = await unzipper.Open.file(
      "./test/SPOT_BUG/A-expected.zip"
    );

    // read obtained zip to in-memory buffer
    const obtainedZip = await unzipper.Open.file(temp);

    // compare both zips
    expect(obtainedZip.numberOfRecords).toBe(expectedZip.numberOfRecords);
    expect(obtainedZip.numberOfRecordsOnDisk).toBe(
      expectedZip.numberOfRecordsOnDisk
    );
    expect(obtainedZip.sizeOfCentralDirectory).toBe(
      expectedZip.sizeOfCentralDirectory
    );
  });
});

function parseHrtimeToMilliseconds(hrtime) {
  return (hrtime[0] + hrtime[1] / 1e6).toFixed(3);
}

function tempFile(prefix, suffix) {
  return path.join(
    tmpdir(),
    `${prefix}${crypto.randomBytes(16).toString("hex")}${suffix}`
  );
}
