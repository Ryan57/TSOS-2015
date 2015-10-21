///<reference path="../globals.ts" />
var TSOS;
(function (TSOS) {
    var PCB = (function () {
        function PCB(PID, PC, accumulator, xReg, yReg, zFlag, base, limit, timeStamp) {
            if (PID === void 0) { PID = 0; }
            if (PC === void 0) { PC = 0; }
            if (accumulator === void 0) { accumulator = 0; }
            if (xReg === void 0) { xReg = 0; }
            if (yReg === void 0) { yReg = 0; }
            if (zFlag === void 0) { zFlag = 0; }
            if (base === void 0) { base = 0; }
            if (limit === void 0) { limit = 0; }
            if (timeStamp === void 0) { timeStamp = new Date(); }
            this.PID = PID;
            this.PC = PC;
            this.accumulator = accumulator;
            this.xReg = xReg;
            this.yReg = yReg;
            this.zFlag = zFlag;
            this.base = base;
            this.limit = limit;
            this.timeStamp = timeStamp;
        }
        PCB.prototype.toString = function () {
            return "PID: " + this.PID.toString() + " PC: " + this.PC.toString() + " Acc: " + this.accumulator.toString() +
                " Xreg: " + this.xReg.toString() + " Yreg: " + this.yReg.toString() + " Zflag: " + this.zFlag.toString() +
                " base: " + this.base.toString() + " limit: " + this.limit.toString() + " Time Stamp: " + this.timeStamp.getTime().toString();
        };
        return PCB;
    })();
    TSOS.PCB = PCB;
})(TSOS || (TSOS = {}));
