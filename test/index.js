const path = require('path');
const crypto = require('crypto');
const { tmpdir } = require('os');
const { expect } = require('chai');
const unzipper = require('unzipper');
const { yapexil2mef } = require('../src');

describe('YAPExIL to MEF conversion.', () => {

  before(() => {
  });

  describe('BLANK_SHEET exercises', () => {
    it('should convert A', async () => {

      // convert to MEF format and write results to temp file
      const temp = tempFile('blank-sheet-', '.zip');

      const startTime = process.hrtime();
      await yapexil2mef('./test/BLANK_SHEET/A.zip', temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));

      console.log(`Time: ${elapsedTime}`);
      
      // read expected zip to in-memory buffer
      const expectedZip = await unzipper.Open.file('./test/BLANK_SHEET/A-expected.zip');

      // read obtained zip to in-memory buffer
      const obtainedZip = await unzipper.Open.file(temp);
      
      // compare both zips
      expect(obtainedZip.numberOfRecords).to.equal(expectedZip.numberOfRecords);
      expect(obtainedZip.numberOfRecordsOnDisk).to.equal(expectedZip.numberOfRecordsOnDisk);
      expect(obtainedZip.sizeOfCentralDirectory).to.equal(expectedZip.sizeOfCentralDirectory);
    });
  });

  describe('EXTENSION exercises', async () => {
    it('should convert A', async () => {

      // convert to MEF format and write results to temp file
      const temp = tempFile('extension-', '.zip');

      const startTime = process.hrtime();
      await yapexil2mef('./test/EXTENSION/A.zip', temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));

      console.log(`Time: ${elapsedTime}`);
      
      // read expected zip to in-memory buffer
      const expectedZip = await unzipper.Open.file('./test/EXTENSION/A-expected.zip');

      // read obtained zip to in-memory buffer
      const obtainedZip = await unzipper.Open.file(temp);
      
      // compare both zips
      expect(obtainedZip.numberOfRecords).to.equal(expectedZip.numberOfRecords);
      expect(obtainedZip.numberOfRecordsOnDisk).to.equal(expectedZip.numberOfRecordsOnDisk);
      expect(obtainedZip.sizeOfCentralDirectory).to.equal(expectedZip.sizeOfCentralDirectory);
    });
  });

  describe('IMPROVEMENT exercises', async () => {
    it('should convert A', async () => {

      // convert to MEF format and write results to temp file
      const temp = tempFile('improvement-', '.zip');

      const startTime = process.hrtime();
      await yapexil2mef('./test/IMPROVEMENT/A.zip', temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));

      console.log(`Time: ${elapsedTime}`);
      
      // read expected zip to in-memory buffer
      const expectedZip = await unzipper.Open.file('./test/IMPROVEMENT/A-expected.zip');

      // read obtained zip to in-memory buffer
      const obtainedZip = await unzipper.Open.file(temp);
      
      // compare both zips
      expect(obtainedZip.numberOfRecords).to.equal(expectedZip.numberOfRecords);
      expect(obtainedZip.numberOfRecordsOnDisk).to.equal(expectedZip.numberOfRecordsOnDisk);
      expect(obtainedZip.sizeOfCentralDirectory).to.equal(expectedZip.sizeOfCentralDirectory);
    });
  });

  describe('BUG_FIX exercises', async () => {
    it('should convert A', async () => {

      // convert to MEF format and write results to temp file
      const temp = tempFile('bug-fix-', '.zip');

      const startTime = process.hrtime();
      await yapexil2mef('./test/BUG_FIX/A.zip', temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));

      console.log(`Time: ${elapsedTime}`);
      
      // read expected zip to in-memory buffer
      const expectedZip = await unzipper.Open.file('./test/BUG_FIX/A-expected.zip');

      // read obtained zip to in-memory buffer
      const obtainedZip = await unzipper.Open.file(temp);
      
      // compare both zips
      expect(obtainedZip.numberOfRecords).to.equal(expectedZip.numberOfRecords);
      expect(obtainedZip.numberOfRecordsOnDisk).to.equal(expectedZip.numberOfRecordsOnDisk);
      expect(obtainedZip.sizeOfCentralDirectory).to.equal(expectedZip.sizeOfCentralDirectory);
    });
  });

  describe('FILL_IN_GAPS exercises', async () => {
    it('should convert A', async () => {

      // convert to MEF format and write results to temp file
      const temp = tempFile('fill-in-gaps-', '.zip');

      const startTime = process.hrtime();
      await yapexil2mef('./test/FILL_IN_GAPS/A.zip', temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));

      console.log(`Time: ${elapsedTime}`);
      
      // read expected zip to in-memory buffer
      const expectedZip = await unzipper.Open.file('./test/FILL_IN_GAPS/A-expected.zip');

      // read obtained zip to in-memory buffer
      const obtainedZip = await unzipper.Open.file(temp);
      
      // compare both zips
      expect(obtainedZip.numberOfRecords).to.equal(expectedZip.numberOfRecords);
      expect(obtainedZip.numberOfRecordsOnDisk).to.equal(expectedZip.numberOfRecordsOnDisk);
      expect(obtainedZip.sizeOfCentralDirectory).to.equal(expectedZip.sizeOfCentralDirectory);
    });
  });

  describe('SORT_BLOCKS exercises', async () => {
    it('should convert A', async () => {

      // convert to MEF format and write results to temp file
      const temp = tempFile('sort-blocks-', '.zip');

      const startTime = process.hrtime();
      await yapexil2mef('./test/SORT_BLOCKS/A.zip', temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));

      console.log(`Time: ${elapsedTime}`);
      
      // read expected zip to in-memory buffer
      const expectedZip = await unzipper.Open.file('./test/SORT_BLOCKS/A-expected.zip');

      // read obtained zip to in-memory buffer
      const obtainedZip = await unzipper.Open.file(temp);
      
      // compare both zips
      expect(obtainedZip.numberOfRecords).to.equal(expectedZip.numberOfRecords);
      expect(obtainedZip.numberOfRecordsOnDisk).to.equal(expectedZip.numberOfRecordsOnDisk);
      expect(obtainedZip.sizeOfCentralDirectory).to.equal(expectedZip.sizeOfCentralDirectory);
    });
  });

  describe('SPOT_BUG exercises', async () => {
    it('should convert A', async () => {

      // convert to MEF format and write results to temp file
      const temp = tempFile('spot-bug-', '.zip');

      const startTime = process.hrtime();
      await yapexil2mef('./test/SPOT_BUG/A.zip', temp);
      const elapsedTime = parseHrtimeToMilliseconds(process.hrtime(startTime));

      console.log(`Time: ${elapsedTime}`);
      
      // read expected zip to in-memory buffer
      const expectedZip = await unzipper.Open.file('./test/SPOT_BUG/A-expected.zip');

      // read obtained zip to in-memory buffer
      const obtainedZip = await unzipper.Open.file(temp);
      
      // compare both zips
      expect(obtainedZip.numberOfRecords).to.equal(expectedZip.numberOfRecords);
      expect(obtainedZip.numberOfRecordsOnDisk).to.equal(expectedZip.numberOfRecordsOnDisk);
      expect(obtainedZip.sizeOfCentralDirectory).to.equal(expectedZip.sizeOfCentralDirectory);
    });
  });
});


function parseHrtimeToMilliseconds(hrtime) {
  return (hrtime[0] + (hrtime[1] / 1e6)).toFixed(3);
}

function tempFile(prefix, suffix) {
  return path.join(tmpdir(),`${prefix}${crypto.randomBytes(16).toString('hex')}${suffix}`);
}
