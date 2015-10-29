/**
 * Created by Ryan on 10/6/2015.
 */
var TSOS;
(function (TSOS) {
    var memory = (function () {
        function memory(mem, length) {
            if (mem === void 0) { mem = new Array(768); }
            if (length === void 0) { length = 768; }
            this.mem = mem;
            this.length = length;
            this.clrMem();
        }
        memory.prototype.clrMem = function () {
            for (var i = 0; i < this.length; i++) {
                this.mem[i] = 0;
            }
        };
        memory.prototype.getMem = function (index) {
            if (index < 0 || index >= this.length)
                throw new RangeError("Memory allocation is out of bounds");
            return this.mem[index];
        };
        memory.prototype.setMem = function (val, index) {
            if (index < 0 || index >= this.length)
                throw new RangeError("Memory allocation is out of bounds.");
            if (val < 0 || val > this.length)
                throw new RangeError("Value is out of byte range.");
            this.mem[index] = val;
        };
        return memory;
    })();
    TSOS.memory = memory;
})(TSOS || (TSOS = {}));
