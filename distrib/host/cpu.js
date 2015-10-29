///<reference path="../globals.ts" />
///<reference path="memory.ts"/>
/* ------------
     CPU.ts

     Requires global.ts.

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
var TSOS;
(function (TSOS) {
    var Cpu = (function () {
        function Cpu(PC, Acc, Xreg, Yreg, Zflag, base, limit, isExecuting) {
            if (PC === void 0) { PC = 0; }
            if (Acc === void 0) { Acc = 0; }
            if (Xreg === void 0) { Xreg = 0; }
            if (Yreg === void 0) { Yreg = 0; }
            if (Zflag === void 0) { Zflag = 0; }
            if (base === void 0) { base = 0; }
            if (limit === void 0) { limit = 0; }
            if (isExecuting === void 0) { isExecuting = false; }
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.base = base;
            this.limit = limit;
            this.isExecuting = isExecuting;
        }
        Cpu.prototype.init = function () {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.base = 0;
            this.limit = 0;
            this.isExecuting = false;
        };
        // a9
        Cpu.prototype.LDA1 = function (value) {
            this.Acc = value;
            this.PC += 2;
            _Kernel.krnTrace("Executing LDA1.");
        };
        // ad
        Cpu.prototype.LDA2 = function (address) {
            this.Acc = _Memory.getMem(address);
            this.PC += 3;
            _Kernel.krnTrace("Executing LDA2.");
        };
        // 8d
        Cpu.prototype.STA = function (address) {
            var value = this.Acc;
            _Memory.setMem(value, address);
            this.PC += 3;
            _Kernel.krnTrace("Executing STA.");
        };
        // 6d
        Cpu.prototype.ADC = function (address) {
            var value = _Memory.getMem(address);
            this.Acc += value;
            this.PC += 3;
            _Kernel.krnTrace("Executing ADC.");
            if (this.Acc > 255)
                return false;
            return true;
        };
        //a2
        Cpu.prototype.LDX1 = function (value) {
            this.Xreg = value;
            this.PC += 2;
            _Kernel.krnTrace("Executing LDX1.");
        };
        //ae
        Cpu.prototype.LDX2 = function (address) {
            this.Xreg = _Memory.getMem(address);
            this.PC += 3;
            _Kernel.krnTrace("Executing LDX2.");
        };
        //a0
        Cpu.prototype.LDY1 = function (value) {
            this.Yreg = value;
            this.PC += 2;
            _Kernel.krnTrace("Executing LDY1.");
        };
        //ac
        Cpu.prototype.LDY2 = function (address) {
            this.Yreg = _Memory.getMem(address);
            this.PC += 3;
            _Kernel.krnTrace("Executing LDY2.");
        };
        //ea
        Cpu.prototype.NOP = function () {
            //No operation
        };
        //ec
        Cpu.prototype.CPX = function (address) {
            var value = _Memory.getMem(address);
            if (value == this.Xreg)
                this.Zflag = 0;
            else
                this.Zflag = 1;
            this.PC += 3;
            _Kernel.krnTrace("Executing CPX.");
        };
        //d0
        Cpu.prototype.BNE = function (value) {
            this.PC += 2;
            _Kernel.krnTrace("Executing BNE.");
            if (this.Zflag == 1) {
                this.PC += value;
                if (this.PC > 255)
                    this.PC = this.PC - 256;
            }
        };
        //ee
        Cpu.prototype.INC = function (address) {
            var value = _Memory.getMem(address);
            value += 1;
            _Memory.setMem(value, address);
            this.PC += 3;
            _Kernel.krnTrace("Executing INC.");
        };
        //ff
        Cpu.prototype.SYS = function (limit) {
            if (this.Xreg == 1) {
                _Kernel.printNumber(this.Yreg);
            }
            if (this.Xreg == 2) {
                var strVal = _MemoryManager.getString(this.Yreg + this.base, limit);
                _Kernel.printText(strVal);
            }
            this.PC += 1;
            _Kernel.krnTrace("Executing SYS.");
        };
        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
            var instAdd = this.base + this.PC;
            var limit = this.base + this.limit;
            var nextValue = 0;
            var nib = 0;
            if (instAdd >= limit) {
                this.abnormalTermination();
                return;
            }
            var inst = _Memory.getMem(instAdd).toString(16);
            switch (inst) {
                // LDA constant
                case 'a9':
                    if (instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.LDA1(nextValue);
                    }
                    break;
                case 'ad':
                    if (instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.LDA2(this.base + nib);
                    }
                    break;
                case '8d':
                    if (instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.STA(this.base + nib);
                    }
                    break;
                case '6d':
                    if (instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else if (!this.ADC(this.base + nib))
                            this.overFlow(instAdd);
                    }
                    break;
                case 'a2':
                    if (instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.LDX1(nextValue);
                    }
                    break;
                case 'ae':
                    if (instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.LDX2(this.base + nib);
                    }
                    break;
                case 'a0':
                    if (instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.LDY1(nextValue);
                    }
                    break;
                case 'ac':
                    if (instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.LDY2(this.base + nib);
                    }
                    break;
                case 'ea':
                    break;
                case 'ec':
                    if (instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.CPX(this.base + nib);
                    }
                    break;
                case 'd0':
                    if (instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.BNE(nextValue);
                    }
                    break;
                case 'ee':
                    if (instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.INC(this.base + nib);
                    }
                    break;
                case 'ff':
                    this.SYS(limit);
                    break;
                case '0':
                    _Kernel.terminateProcessFromBase(this.base);
                    this.isExecuting = false;
                    break;
                default:
                    this.invalidOpCode(inst);
                    break;
            }
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(TIMER_IRQ, null));
            TSOS.Control.updateMemTable();
            TSOS.Control.updateCPUTable();
        };
        Cpu.prototype.memAccessViolation = function (address) {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, [address, this.base]));
            this.isExecuting = false;
        };
        Cpu.prototype.overFlow = function (address) {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(OVERFLOW_IRQ, [address, this.base]));
            this.isExecuting = false;
        };
        Cpu.prototype.invalidOpCode = function (opCode) {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(INVALID_OP_CODE_IRQ, [opCode, this.base]));
            this.isExecuting = false;
        };
        Cpu.prototype.abnormalTermination = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(UNEXPECTED_TERMINATION_IRQ, this.base));
            this.isExecuting = false;
        };
        Cpu.prototype.convertLittleEndian = function (address) {
            var val2 = _Memory.getMem(address + 1);
            var val1 = _Memory.getMem(address);
            return (val2 * 256) + val1;
        };
        return Cpu;
    })();
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
