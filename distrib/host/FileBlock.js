///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />
var TSOS;
(function (TSOS) {
    var FileBlock = (function () {
        function FileBlock(location, track, sector, block, inUse, data) {
            if (location === void 0) { location = "0.0.0"; }
            if (track === void 0) { track = 0; }
            if (sector === void 0) { sector = 0; }
            if (block === void 0) { block = 0; }
            if (inUse === void 0) { inUse = false; }
            if (data === void 0) { data = []; }
            this.location = location;
            this.track = track;
            this.sector = sector;
            this.block = block;
            this.inUse = inUse;
            this.data = data;
        }
        FileBlock.prototype.loadBlock = function (track, sector, block) {
            this.location = track.toString() + '.' + sector.toString() + '.' + block.toString();
            var data = sessionStorage.getItem(this.location);
            this.data = data.split('.');
            if (this.getByte(0) == 1)
                this.inUse = true;
            else
                this.inUse = false;
            this.track = this.getByte(1);
            this.sector = this.getByte(2);
            this.block = this.getByte(3);
        };
        FileBlock.prototype.setByte = function (index, value) {
            var ret = false;
            var hexVal;
            if (index < this.data.length) {
                if (value == -1)
                    hexVal = "-1";
                else {
                    hexVal = value.toString(16);
                    if (hexVal.length == 1)
                        hexVal = '0' + hexVal;
                }
                this.data[index] = hexVal;
                ret = true;
            }
            return ret;
        };
        FileBlock.prototype.getLocation = function () {
            var num = this.location[0];
            var retVal = [];
            retVal.push(num.toString());
            num = this.location[2];
            retVal.push(num.toString());
            num = this.location[4];
            retVal.push(num.toString());
            return retVal;
        };
        FileBlock.prototype.getByte = function (index) {
            var byte = -1;
            var hexVal;
            var val;
            if (index < this.data.length) {
                hexVal = this.data[index];
                if (hexVal == "-1")
                    val = -1;
                else
                    val = parseInt(hexVal, 16);
                byte = val;
            }
            return byte;
        };
        FileBlock.prototype.setInUse = function (inUse) {
            var val = 0;
            if (inUse == true)
                val = 1;
            this.setByte(0, val);
        };
        FileBlock.prototype.setTSB = function (track, sector, block) {
            this.setByte(1, track);
            this.setByte(2, sector);
            this.setByte(3, block);
        };
        FileBlock.prototype.setText = function (text, append) {
            if (append === void 0) { append = true; }
            var index = -1;
            var readIndex = 0;
            var value = 0;
            if (append == true) {
                for (var i = 4; (i < (this.data.length)) && index == -1; i++) {
                    if (this.getByte(i) == -1)
                        index = i;
                }
            }
            else
                index = 4;
            for (var i = index; i < (this.data.length); i++) {
                if (readIndex < text.length) {
                    value = TSOS.Utils.getAsciiVal(text[readIndex]);
                    this.setByte(i, value);
                    readIndex++;
                }
                else
                    this.setByte(i, -1);
            }
            return readIndex;
        };
        FileBlock.prototype.setData = function (data, append) {
            if (append === void 0) { append = true; }
            var index = -1;
            var readIndex = 0;
            var value = 0;
            if (append == true) {
                for (var i = 4; (i < (this.data.length)) && index == -1; i++) {
                    if (this.getByte(i) == -1)
                        index = i;
                }
            }
            else
                index = 4;
            for (var i = index; i < (this.data.length); i++) {
                if (readIndex < data.length) {
                    this.setByte(i, data[readIndex]);
                    readIndex++;
                }
                else
                    this.setByte(i, -1);
            }
            return readIndex;
        };
        FileBlock.prototype.getText = function () {
            var end = false;
            var str = "";
            for (var i = 4; (i < (this.data.length)) && !end; i++) {
                if (this.getByte(i) == -1)
                    end = true;
                else
                    str += TSOS.Utils.getAsciiChar(this.getByte(i));
            }
            return str;
        };
        FileBlock.prototype.getData = function () {
            var end = false;
            var data = [];
            for (var i = 4; (i < (this.data.length)) && !end; i++) {
                if (this.getByte(i) == -1)
                    end = true;
                else
                    data.push(this.getByte(i));
            }
            return data;
        };
        FileBlock.prototype.saveBlock = function () {
            sessionStorage.setItem(this.location, this.data.join('.'));
        };
        FileBlock.prototype.createKey = function () {
            return this.track.toString() + '.' + this.sector.toString() + '.' + this.block.toString();
        };
        FileBlock.prototype.getNextBlock = function () {
            if (this.track == -1 || this.sector == -1 || this.block == -1)
                return null;
            var nextBlock = new TSOS.FileBlock();
            nextBlock.loadBlock(this.track, this.sector, this.block);
            return nextBlock;
        };
        FileBlock.prototype.getLastBlock = function () {
            var nextBlock = this.getNextBlock();
            var currBlock = nextBlock;
            while (nextBlock != null) {
                currBlock = nextBlock;
                nextBlock = nextBlock.getNextBlock();
            }
            return currBlock;
        };
        FileBlock.prototype.clearData = function () {
            for (var i = 4; i < (this.data.length); i++) {
                this.setByte(i, -1);
            }
        };
        return FileBlock;
    })();
    TSOS.FileBlock = FileBlock;
})(TSOS || (TSOS = {}));
