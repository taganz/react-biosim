import { LogFile } from '@/simulation/logger/LogFile'; // Assuming File class is in a file named File.ts

describe('File', () => {
  let file: LogFile;

  beforeEach(() => {
    file = new LogFile();
  });

  afterEach(() => {
    //file = null;
  });

  test('should open file successfully', () => {
    file.open();
    expect(file.isOpen).toBeTruthy();
  });

  test('should write to file when open', () => {
    file.open();
    file.write('Line 1');
    expect(file.content).toEqual(['Line 1']);
  });

  test('should not write to file when closed', () => {
    file.write('Line 1');
    expect(file.content).toEqual([]);
  });

  test('should close file successfully', () => {
    file.open();
    file.write('Line 1');
    file.close();
    expect(file.isOpen).toBeFalsy();
  });
});

