// NO FUNCIONA PERQUE CALDRIA ENTORN DE TEST DOM. BORRAR

import LogFile2 from '@/simulation/logger/LogFile2';

describe('LogFile2', () => {
    let logFile: LogFile2;

    beforeEach(() => {
        logFile = new LogFile2();
    });

    afterEach(() => {
        // Clean up any resources if needed
    });

    test('should open file', async () => {
        // Mock the window.showSaveFilePicker method
        window.showSaveFilePicker = jest.fn().mockResolvedValueOnce({ createWritable: jest.fn() });

        await logFile.open();

        expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
    });

    test('should write to file', async () => {
        // Mock the window.showSaveFilePicker and createWritable methods
        window.showSaveFilePicker = jest.fn().mockResolvedValueOnce({ createWritable: jest.fn() });
        const writeMock = jest.fn();
        logFile.open = jest.fn().mockResolvedValueOnce({ write: writeMock });

        await logFile.write('First log entry.');

        expect(writeMock).toHaveBeenCalledTimes(1);
    });

    /*
    test.skip('should close file', async () => {
        // Mock the createWritable and close methods
        const closeMock = jest.fn();
        logFile.writableStream = { close: closeMock };

        await logFile.close();

        expect(closeMock).toHaveBeenCalledTimes(1);
    });
    */
});