///<reference path="../globals.ts" />
///<reference path="pcb.ts" />
///<reference path="../host/control.ts" />
var TSOS;
(function (TSOS) {
    var MemoryManager = (function () {
        function MemoryManager(loadedPCB) {
            if (loadedPCB === void 0) { loadedPCB = null; }
            this.loadedPCB = loadedPCB;
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
        }
        MemoryManager.prototype.loadProgram = function (prog, pid) {
            if (this.loadedPCB != null)
                return null;
            var bytes = prog.split(' ');
            var value = 0;
            _Memory.clrMem();
            for (var i = 0; (i < bytes.length) && (i < _MemPartitionSize); i++) {
                value = parseInt(bytes[i], 16);
                _Memory.setMem(value, i);
                _Kernel.krnTrace(value.toString());
            }
            var PcB = new TSOS.PCB(pid);
            PcB.base = 0;
            PcB.limit = _MemPartitionSize;
            this.loadedPCB = PcB;
            TSOS.Control.updateMemTable();
            return PcB;
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
