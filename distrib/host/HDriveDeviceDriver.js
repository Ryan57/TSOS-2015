///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />
var TSOS;
(function (TSOS) {
    var HDriveDeviceDriver = (function () {
        function HDriveDeviceDriver(tracks, sectors, secBlock, isFormatted) {
            if (isFormatted === void 0) { isFormatted = false; }
            this.tracks = tracks;
            this.sectors = sectors;
            this.secBlock = secBlock;
            this.isFormatted = isFormatted;
            this.allocateMem();
        }
        HDriveDeviceDriver.prototype.allocateMem = function () {
            var key = null;
            var data = "";
            for (var i = 0; i < 64; i++) {
                if (i != 0) {
                    data += '.';
                }
                data += "00";
            }
            for (var t = 0; t < this.tracks; t++) {
                for (var s = 0; s < this.sectors; s++) {
                    for (var b = 0; b < this.secBlock; b++) {
                        key = this.createKey(t, s, b);
                        sessionStorage.setItem(key, data);
                    }
                }
            }
        };
        HDriveDeviceDriver.prototype.format = function () {
            var key = null;
            var data = "00.-1.-1.-1";
            for (var i = 0; i < 60; i++) {
                data += ".-1";
            }
            for (var t = 0; t < this.tracks; t++) {
                for (var s = 0; s < this.sectors; s++) {
                    for (var b = 0; b < this.secBlock; b++) {
                        if (!(t == 0 && s == 0 && b == 0)) {
                            key = this.createKey(t, s, b);
                            sessionStorage.setItem(key, data);
                        }
                    }
                }
            }
            this.isFormatted = true;
            TSOS.Control.updateHDtable();
        };
        //returns HDD_NOT_FORMATTED, HDD_FILE_NAME_TO_LONG, HDD_FILE_DIR_FULL, HDD_FILE_NAME_DUPLICATE, HDD_DRIVE_FULL, && HDD_SUCCESS
        HDriveDeviceDriver.prototype.createFile = function (fName, update) {
            if (update === void 0) { update = true; }
            if (this.isFormatted == false)
                return HDD_NOT_FORMATTED;
            if (fName.length > 60)
                return HDD_FILE_NAME_TO_LONG;
            var DIRblock = this.findNextFileDIRblock();
            if (DIRblock == null)
                return HDD_FILE_DIR_FULL;
            if (this.isDuplicateFileName(fName) == true)
                return HDD_FILE_NAME_DUPLICATE;
            var fileBlock = this.findNextFileBlock();
            if (fileBlock == null)
                return HDD_DRIVE_FULL;
            DIRblock.setInUse(true);
            var location = fileBlock.getLocation();
            DIRblock.setTSB(location[0], location[1], location[2]);
            DIRblock.setText(fName, false);
            fileBlock.setInUse(true);
            fileBlock.setTSB(-1, -1, -1);
            fileBlock.clearData();
            fileBlock.saveBlock();
            DIRblock.saveBlock();
            if (update) {
                TSOS.Control.updateHDtable();
            }
            return HDD_SUCCESS;
        };
        //returns HDD_NOT_FORMATTED, HDD_FILE_NOT_FOUND, HDD_DATA_CORRUPTED, HDD_DRIVE_FULL, && HDD_SUCCESS
        HDriveDeviceDriver.prototype.writeToFileText = function (fileName, data, update) {
            if (update === void 0) { update = true; }
            var dirBlock = null;
            var currFileBlock = null;
            var bytesWritten = 0;
            var error = false;
            var ret = HDD_SUCCESS;
            var str = data;
            var totalBytesWritten = 0;
            var newFileBlock = null;
            if (this.isFormatted == false) {
                return HDD_NOT_FORMATTED;
            }
            dirBlock = this.findDirBlock(fileName);
            if (dirBlock == null)
                return HDD_FILE_NOT_FOUND;
            currFileBlock = dirBlock.getLastBlock();
            if (currFileBlock == null) {
                return HDD_DATA_CORRUPTED;
            }
            while ((totalBytesWritten < data.length) && (error != true)) {
                bytesWritten = currFileBlock.setText(str, true);
                currFileBlock.saveBlock();
                totalBytesWritten += bytesWritten;
                str = str.substr(bytesWritten);
                if (totalBytesWritten < data.length) {
                    newFileBlock = this.findNextFileBlock();
                    if (newFileBlock == null) {
                        error = true;
                        ret = HDD_DRIVE_FULL;
                    }
                    else {
                        var location = newFileBlock.getLocation();
                        currFileBlock.setTSB(location[0], location[1], location[2]);
                        currFileBlock.saveBlock();
                        newFileBlock.setInUse(true);
                        newFileBlock.setTSB(-1, -1, -1);
                        newFileBlock.clearData();
                        newFileBlock.saveBlock();
                        currFileBlock = newFileBlock;
                    }
                }
            }
            if (update) {
                TSOS.Control.updateHDtable();
            }
            return ret;
        };
        //returns HDD_NOT_FORMATTED, HDD_FILE_NOT_FOUND, HDD_DATA_CORRUPTED, HDD_DRIVE_FULL, && HDD_SUCCESS
        HDriveDeviceDriver.prototype.writeToFileData = function (fileName, data, update) {
            if (update === void 0) { update = true; }
            var dirBlock = null;
            var currFileBlock = null;
            var bytesWritten = 0;
            var error = false;
            var ret = HDD_SUCCESS;
            var readIndex = 0;
            var totalBytesWritten = 0;
            var newFileBlock = null;
            var temp = [];
            if (this.isFormatted == false) {
                return HDD_NOT_FORMATTED;
            }
            dirBlock = this.findDirBlock(fileName);
            if (dirBlock == null)
                return HDD_FILE_NOT_FOUND;
            currFileBlock = dirBlock.getLastBlock();
            if (currFileBlock == null) {
                return HDD_DATA_CORRUPTED;
            }
            while ((totalBytesWritten < data.length) && (error != true)) {
                temp = [];
                for (var i = totalBytesWritten; i < data.length; i++)
                    temp.push(data[i]);
                bytesWritten = currFileBlock.setData(temp, true);
                currFileBlock.saveBlock();
                totalBytesWritten += bytesWritten;
                if (totalBytesWritten < data.length) {
                    newFileBlock = this.findNextFileBlock();
                    if (newFileBlock == null) {
                        error = true;
                        ret = HDD_DRIVE_FULL;
                    }
                    else {
                        var location = newFileBlock.getLocation();
                        currFileBlock.setTSB(location[0], location[1], location[2]);
                        currFileBlock.saveBlock();
                        newFileBlock.setInUse(true);
                        newFileBlock.setTSB(-1, -1, -1);
                        newFileBlock.clearData();
                        newFileBlock.saveBlock();
                        currFileBlock = newFileBlock;
                    }
                }
            }
            if (update) {
                TSOS.Control.updateHDtable();
            }
            return ret;
        };
        //returns HDD_NOT_FORMATTED, HDD_FILE_NOT_FOUND, HDD_DATA_CORRUPTED, HDD_DRIVE_FULL, && HDD_SUCCESS
        HDriveDeviceDriver.prototype.readToFileText = function (fileName, update) {
            if (update === void 0) { update = true; }
            var dirBlock;
            var currFileBlock;
            var buffer = "";
            if (this.isFormatted != true) {
                return [HDD_NOT_FORMATTED, null];
            }
            dirBlock = this.findDirBlock(fileName);
            if (dirBlock == null) {
                return [HDD_FILE_NOT_FOUND, null];
            }
            currFileBlock = dirBlock.getNextBlock();
            if (currFileBlock == null) {
                return [HDD_DATA_CORRUPTED, null];
            }
            while (currFileBlock != null) {
                buffer += currFileBlock.getText();
                currFileBlock = currFileBlock.getNextBlock();
            }
            if (update) {
                TSOS.Control.updateHDtable();
            }
            return [HDD_SUCCESS, buffer];
        };
        HDriveDeviceDriver.prototype.readToFileData = function (fileName, update) {
            if (update === void 0) { update = true; }
            var dirBlock;
            var currFileBlock;
            var buffer = [];
            var temp = [];
            if (this.isFormatted != true) {
                return [HDD_NOT_FORMATTED, null];
            }
            dirBlock = this.findDirBlock(fileName);
            if (dirBlock == null) {
                return [HDD_FILE_NOT_FOUND, null];
            }
            currFileBlock = dirBlock.getNextBlock();
            if (currFileBlock == null) {
                return [HDD_DATA_CORRUPTED, null];
            }
            while (currFileBlock != null) {
                temp = currFileBlock.getData();
                for (var i = 0; i < temp.length; i++) {
                    buffer.push(temp[i]);
                }
                currFileBlock = currFileBlock.getNextBlock();
            }
            if (update) {
                TSOS.Control.updateHDtable();
            }
            return [HDD_SUCCESS, buffer];
        };
        //returns HDD_NOT_FORMATTED, HDD_FILE_NOT_FOUND, && HDD_SUCCESS
        HDriveDeviceDriver.prototype.deleteFile = function (fileName, update) {
            if (update === void 0) { update = true; }
            var dirBlock;
            var currFileBlock;
            var nextFileBlock;
            if (this.isFormatted == false) {
                return HDD_NOT_FORMATTED;
            }
            dirBlock = this.findDirBlock(fileName);
            if (dirBlock == null)
                return HDD_FILE_NOT_FOUND;
            dirBlock.setInUse(false);
            dirBlock.saveBlock();
            currFileBlock = dirBlock.getNextBlock();
            while (currFileBlock != null) {
                currFileBlock.setInUse(false);
                currFileBlock.saveBlock();
                currFileBlock = currFileBlock.getNextBlock();
            }
            if (update) {
                TSOS.Control.updateHDtable();
            }
            return HDD_SUCCESS;
        };
        HDriveDeviceDriver.prototype.listFiles = function () {
            var currFileBlock = new TSOS.FileBlock();
            var fileList = [];
            //search through for loops similar to TSB (searches through sectors > searches through blocks)
            if (this.isFormatted != true)
                return null;
            for (var s = 0; (s < this.sectors); s++) {
                for (var b = 1; (b < this.secBlock); b++) {
                    currFileBlock.loadBlock(0, s, b);
                    if (currFileBlock.inUse == true) {
                        fileList.push(currFileBlock.getText());
                    }
                }
            }
            return fileList;
        };
        HDriveDeviceDriver.prototype.findNextFileDIRblock = function () {
            var currFileBlock = new TSOS.FileBlock();
            var dirFileBlock = null;
            //search through for loops similar to TSB (searches through sectors > searches through blocks)
            for (var s = 0; (s < this.sectors) && (dirFileBlock == null); s++) {
                for (var b = 1; (b < this.secBlock) && (dirFileBlock == null); b++) {
                    currFileBlock.loadBlock(0, s, b);
                    if (currFileBlock.inUse == false) {
                        dirFileBlock = currFileBlock;
                    }
                }
            }
            return dirFileBlock;
        };
        HDriveDeviceDriver.prototype.findNextFileBlock = function () {
            var currFileBlock = new TSOS.FileBlock();
            var fileBlock = null;
            //search through for loops similar to TSB (searches through sectors > searches through blocks)
            for (var t = 1; (t < this.tracks) && (fileBlock == null); t++) {
                for (var s = 0; (s < this.sectors) && (fileBlock == null); s++) {
                    for (var b = 0; (b < this.secBlock) && (fileBlock == null); b++) {
                        currFileBlock.loadBlock(t, s, b);
                        if (currFileBlock.inUse == false) {
                            fileBlock = currFileBlock;
                        }
                    }
                }
            }
            return fileBlock;
        };
        HDriveDeviceDriver.prototype.isDuplicateFileName = function (name) {
            var currFileBlock = new TSOS.FileBlock();
            var found = false;
            //search through for loops similar to TSB (searches through sectors > searches through blocks)
            for (var s = 0; (s < this.sectors) && (found != true); s++) {
                for (var b = 1; (b < this.secBlock) && (found != true); b++) {
                    currFileBlock.loadBlock(0, s, b);
                    if (currFileBlock.inUse == true) {
                        if (currFileBlock.getText() == name) {
                            found = true;
                        }
                    }
                }
            }
            return found;
        };
        HDriveDeviceDriver.prototype.findDirBlock = function (fileName) {
            var currFileBlock = new TSOS.FileBlock();
            var dirBlock = null;
            //search through for loops similar to TSB (searches through sectors > searches through blocks)
            for (var s = 0; (s < this.sectors) && (dirBlock == null); s++) {
                for (var b = 1; (b < this.secBlock) && (dirBlock == null); b++) {
                    currFileBlock.loadBlock(0, s, b);
                    if (currFileBlock.inUse == true) {
                        if (currFileBlock.getText() == fileName) {
                            dirBlock = currFileBlock;
                        }
                    }
                }
            }
            return dirBlock;
        };
        HDriveDeviceDriver.prototype.createKey = function (track, sectors, block) {
            return track.toString() + '.' + sectors.toString() + '.' + block.toString();
        };
        return HDriveDeviceDriver;
    })();
    TSOS.HDriveDeviceDriver = HDriveDeviceDriver;
})(TSOS || (TSOS = {}));
