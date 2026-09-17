import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, csvRow } from '../src/utils/csv';

test('CSV quotes commas, quotes, newlines and Vietnamese names', () => {
  assert.equal(csvCell('Nguyễn "A", B\nC'), '"Nguyễn ""A"", B\nC"');
  assert.equal(csvRow(['A', 100, null]), '"A",100,""\r\n');
});
test('CSV text cannot start a spreadsheet formula', () => {
  for (const input of ['=1+1', '+SUM(A1)', '-1+1', '@SUM(A1)', '\t=1', '  =1', '\nhello']) {
    assert.ok(csvCell(input).startsWith('"\''));
  }
  assert.equal(csvCell(-10), '-10');
  assert.equal(csvCell(Infinity), '');
});
