var unexpected = require('unexpected'),
    getTemporaryFilePath = require('../lib/getTemporaryFilePath'),
    sinon = require('sinon'),
    fs = require('fs'),
    os;

try {
    os = require('os');
} catch (e) {
    // Not available in older node.js versions
}

var originalProcessPlatform = process.platform,
    originalProcessEnv = process.env,
    originalOs = os,
    originalOsTmpdir = os && os.tmpdir,
    originalFsRealpathSync = fs.realpathSync;

describe('getTemporaryFilePath', function () {
    var expect = unexpected.clone().installPlugin(require('unexpected-sinon'));

    // Restore all properties that might be mocked out:
    afterEach(function () {
        delete getTemporaryFilePath.getTempDir.tempDir;
        process.platform = originalProcessPlatform;
        process.env = originalProcessEnv;
        os = originalOs;
        fs.realpathSync = originalFsRealpathSync;
    });

    describe('#getTempDir()', function () {
        describe('with no os.tmpdir', function () {
            beforeEach(function () {
                delete os.tmpdir;
            });

            describe('in a win32 environment', function () {
                beforeEach(function () {
                    process.platform = 'win32';
                });
                describe('with a TMP environment variable', function () {
                    beforeEach(function () {
                        process.env = {TMP: 'C:\\blabla'}
                    });

                    it('should return the value of the TMP environment variable if fs.realpathSync says it exists', function () {
                        fs.realpathSync = sinon.spy(function (path) {
                            return path;
                        });
                        expect(getTemporaryFilePath.getTempDir(), 'to equal', 'C:\\blabla');
                    });

                    it('should throw if fs.realpathSync says the TMP environment points to a non-existent dir', function () {
                        fs.realpathSync = function (path) {
                            throw new Error('ENOENT');
                        };
                        expect(getTemporaryFilePath.getTempDir, 'to throw', 'ENOENT');
                    });
                });

                describe('with no TMP environment variable', function () {
                    beforeEach(function () {
                        process.env = {};
                    });

                    it('should return c:\\tmp if fs.realpathSync says it exists', function () {
                        fs.realpathSync = sinon.spy(function (path) {
                            return path;
                        });
                        expect(getTemporaryFilePath.getTempDir(), 'to equal', 'c:\\tmp');
                        expect(fs.realpathSync, 'was called once');
                    });

                    it('should throw if fs.realpathSync says c:\\tmp does not exist', function () {
                        fs.realpathSync = sinon.spy(function (path) {
                            throw new Error('ENOENT');
                        });
                        expect(getTemporaryFilePath.getTempDir, 'to throw', 'ENOENT');
                        expect(fs.realpathSync, 'was called once');
                    });
                });
            });
        });
    });
});
