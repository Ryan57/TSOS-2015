///<reference path="../globals.ts" />
///<reference path="pcb.ts" />
///<reference path="../host/control.ts" />
var TSOS;
(function (TSOS) {
    var MemoryManager = (function () {
        function MemoryManager(loadedPartitions, partitionBaseAddress) {
            if (loadedPartitions === void 0) { loadedPartitions = new Array(); }
            if (partitionBaseAddress === void 0) { partitionBaseAddress = new Array(); }
            this.loadedPartitions = loadedPartitions;
            this.partitionBaseAddress = partitionBaseAddress;
            this.ascii = { 32: ' ',
                48: '0',
                49: '1',
                50: '2',
                51: '3',
                52: '4',
                53: '5',
                54: '6',
                55: '7',
                56: '8',
                57: '9',
                97: 'a',
                98: 'b',
                99: 'c',
                100: 'd',
                101: 'e',
                102: 'f',
                103: 'g',
                104: 'h',
                105: 'i',
                106: 'j',
                107: 'k',
                108: 'l',
                109: 'm',
                110: 'n',
                111: 'o',
                112: 'p',
                113: 'q',
                114: 'r',
                115: 's',
                116: 't',
                117: 'u',
                118: 'v',
                119: 'w',
                120: 'x',
                121: 'y',
                122: 'z' };
            var baseAddress = 0;
            this.loadedPartitions[0] = false;
            this.loadedPartitions[1] = false;
            this.loadedPartitions[2] = false;
            for (var i = 0; i < 3; i++) {
                this.partitionBaseAddress[i] = baseAddress;
                baseAddress += 256;
            }
        }
        MemoryManager.prototype.availablePartitions = function () {
            var availPartitions = 0;
            for (var i = 0; i < 3; i++) {
                if (this.loadedPartitions[i] == false)
                    availPartitions++;
            }
            return availPartitions;
        };
        MemoryManager.prototype.nextAvailPartitions = function () {
            var part = -1;
            for (var i = 0; (i < 3) && part == -1; i++) {
                if (this.loadedPartitions[i] == false) {
                    part = i;
                }
            }
            return part;
        };
        MemoryManager.prototype.getPartitionBytes = function (partition) {
            if (partition < 0 || partition > 2)
                return null;
            var base = this.partitionBaseAddress[partition];
            var data = [];
            var limit = base + 256;
            for (var i = base; i < limit; i++) {
                data.push(_Memory.getMem(i));
            }
            return data;
        };
        MemoryManager.prototype.loadProgram = function (prog, pid) {
            var found = false;
            var partition = 0;
            for (var i = 0; (i < this.loadedPartitions.length) && !found; i++) {
                if (this.loadedPartitions[i] == false) {
                    partition = i;
                    found = true;
                }
            }
            _Kernel.krnTrace("partition " + partition.toString());
            if (!found)
                return null;
            // if (this.loadedPCB != null)
            //   return null;
            var bytes = prog.split(' ');
            var value = 0;
            this.clrPartition(partition);
            var base = this.partitionBaseAddress[partition];
            var limit = base + _MemPartitionSize;
            var byteIndex = 0;
            _Kernel.krnTrace("len" + bytes.length.toString());
            for (var i = base; (byteIndex < bytes.length) && (i < limit); i++) {
                value = parseInt(bytes[byteIndex], 16);
                _Memory.setMem(value, i);
                byteIndex++;
                _Kernel.krnTrace("index, value " + i.toString() + "," + value.toString(16));
            }
            var PcB = new TSOS.PCB(pid);
            PcB.base = this.partitionBaseAddress[partition];
            PcB.limit = _MemPartitionSize;
            this.loadedPartitions[partition] = true;
            TSOS.Control.updateMemTable();
            return PcB;
        };
        MemoryManager.prototype.loadProgramBytes = function (prog, partition) {
            if (partition < 0 || partition > 2)
                return false;
            // if (this.loadedPCB != null)
            //   return null;
            this.clrPartition(partition);
            var base = this.partitionBaseAddress[partition];
            var limit = base + _MemPartitionSize;
            _Kernel.krnTrace("base " + base.toString() + " part " + partition.toString());
            var byteIndex = 0;
            for (var i = base; (byteIndex < prog.length) && (i < limit); i++) {
                _Kernel.krnTrace("Index " + i.toString() + " value " + prog[byteIndex].toString());
                _Memory.setMem(prog[byteIndex], i);
                byteIndex++;
            }
            this.loadedPartitions[partition] = true;
            TSOS.Control.updateMemTable();
            return true;
        };
        MemoryManager.prototype.findPartitionFromBase = function (base) {
            var ret = -1;
            for (var i = 0; (i < this.partitionBaseAddress.length) && (ret == -1); i++) {
                if (this.partitionBaseAddress[i] == base)
                    ret = i;
            }
            return ret;
        };
        MemoryManager.prototype.clrPartition = function (iPartition) {
            if (iPartition < 0 || iPartition > 2)
                return;
            var base = this.partitionBaseAddress[iPartition];
            var limit = base + _MemPartitionSize;
            for (var i = base; i < limit; i++) {
                _Memory.setMem(0, i);
            }
            this.loadedPartitions[iPartition] = false;
        };
        MemoryManager.prototype.clrAllPartitions = function () {
            for (var i = 0; i < 3; i++) {
                this.clrPartition(i);
            }
            TSOS.Control.updateMemTable();
        };
        MemoryManager.prototype.unmarkPartition = function (baseAddr) {
            var partition = -1;
            for (var i = 0; (i < this.partitionBaseAddress.length) && (partition == -1); i++) {
                if (this.partitionBaseAddress[i] == baseAddr)
                    partition = i;
            }
            if (partition == -1)
                return;
            this.loadedPartitions[partition] = false;
        };
        MemoryManager.prototype.getString = function (address, limit) {
            var str = "";
            var val = 0;
            var end = false;
            while ((address < limit) && !end) {
                val = _Memory.getMem(address);
                if (val == 0)
                    end = true;
                else {
                    if ((val >= 97 && val <= 122) || (val >= 48 && val <= 57) || val == 32)
                        str += this.ascii[val];
                    address++;
                }
            }
            return str;
        };
        return MemoryManager;
    })();
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=MemoryManager.js.map