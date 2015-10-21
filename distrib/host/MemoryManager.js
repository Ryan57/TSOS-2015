var TSOS;
(function (TSOS) {
    var MemoryManager = (function () {
        function MemoryManager() {
        }
        MemoryManager.prototype.loadProgram = function (prog) {
            var bytes = prog.split(" ");
            var value = 0;
            for (var i = 0; (i < bytes.length) && (i < _MemPartitionSize); i++) {
                value = parseInt(bytes[i], 16);
                _Memory.setMem(value, i);
            }
            if (bytes.length > _MemPartitionSize) {
                return false;
            }
            return true;
        };
        return MemoryManager;
    })();
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
