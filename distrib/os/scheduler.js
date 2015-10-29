///<reference path="../globals.ts" />
///<reference path="pcb.ts" />
/**
 * Created by Ryan on 10/2/2015.
 */
var TSOS;
(function (TSOS) {
    var scheduler = (function () {
        function scheduler(processRunning, nextPID, readyQueue, residentQueue, terminatedQ) {
            if (processRunning === void 0) { processRunning = null; }
            if (nextPID === void 0) { nextPID = 0; }
            if (readyQueue === void 0) { readyQueue = new TSOS.Queue(); }
            if (residentQueue === void 0) { residentQueue = new TSOS.Queue(); }
            if (terminatedQ === void 0) { terminatedQ = new TSOS.Queue(); }
            this.processRunning = processRunning;
            this.nextPID = nextPID;
            this.readyQueue = readyQueue;
            this.residentQueue = residentQueue;
            this.terminatedQ = terminatedQ;
        }
        scheduler.prototype.removeFromResQueue = function (PID) {
            var tempQ = new TSOS.Queue();
            var PCB;
            var retPCB = null;
            while (this.residentQueue.getSize() > 0) {
                PCB = this.residentQueue.dequeue();
                if (PID == PCB.PID) {
                    retPCB = PCB;
                }
                else {
                    tempQ.enqueue(PCB);
                }
            }
            while (tempQ.getSize() > 0) {
                this.residentQueue.enqueue(tempQ.dequeue());
            }
            return retPCB;
        };
        scheduler.prototype.removeFromReadyQueue = function (PID) {
            var tempQ = new TSOS.Queue();
            var PCB;
            var retPCB = null;
            while (this.readyQueue.getSize() > 0) {
                PCB = this.readyQueue.dequeue();
                if (PID == PCB.PID) {
                    retPCB = PCB;
                }
                else {
                    tempQ.enqueue(PCB);
                }
            }
            while (tempQ.getSize() > 0) {
                this.readyQueue.enqueue(tempQ.dequeue());
            }
            return retPCB;
        };
        scheduler.prototype.createProcess = function (progInput) {
            // Load program, and get pcb. If program already loaded,
            // pcb is null
            var PcB = _MemoryManager.loadProgram(progInput, this.nextPID);
            // Return false if program already loaded
            if (PcB == null)
                return null;
            this.residentQueue.enqueue(PcB);
            // Send trace message
            _Kernel.krnTrace("Created process with PID " + this.nextPID + ".");
            // Increment nextPID
            this.nextPID++;
            // Return true
            return PcB;
        };
        scheduler.prototype.executeProcess = function (pid) {
            if (this.residentQueue.getSize() == 0)
                return false;
            _Kernel.krnTrace("this 1");
            var PCB = this.removeFromResQueue(pid);
            _Kernel.krnTrace("this 2");
            if (PCB == null)
                return false;
            this.readyQueue.enqueue(PCB);
            _Kernel.krnTrace("this 3");
            if (this.processRunning == null)
                this.contextSwitch();
            _Kernel.krnTrace("this 4");
            // Copy all register values from pcb to cpu registers
            /*    _CPU.Xreg = this.processRunning.xReg;
                _CPU.Yreg = this.processRunning.yReg;
                _CPU.Acc = this.processRunning.accumulator;
                _CPU.PC = this.processRunning.PC;
                _CPU.Zflag = this.processRunning.zFlag;
                _CPU.base = this.processRunning.base;
                _CPU.limit = this.processRunning.limit;
                // Set loaded process to null
    
                // Set cpu.isExecuting to true
                _CPU.isExecuting = true; */
            // Trace executed process by pid
            _Kernel.krnTrace("Executed process with PID " + this.nextPID + ".");
            // Return true
            return true;
        };
        scheduler.prototype.terminateProcess = function (pid) {
            var PCB = null;
            if (this.processRunning.PID == pid) {
                PCB = this.processRunning;
                this.terminatedQ.enqueue(PCB);
                this.processRunning = null;
                this.contextSwitch();
            }
            else {
                PCB = this.removeFromReadyQueue(pid);
                if (PCB != null) {
                    this.terminatedQ.enqueue(PCB);
                }
            }
            if (PCB != null) {
                _MemoryManager.unmarkPartition(PCB.base);
                // Trace terminated process by pid
                _Kernel.krnTrace("Terminating process with PID " + PCB.PID + ".");
                // Trace pcb values
                _Kernel.krnTrace(PCB.toString());
            }
            // return 1
            return PCB;
        };
        scheduler.prototype.contextSwitch = function () {
            _Kernel.krnTrace("Performing context switch.");
            if (this.processRunning != null) {
                _Kernel.krnTrace("that 1-1");
                if (this.readyQueue.getSize() > 0) {
                    _Kernel.krnTrace("that 1-2");
                    this.processRunning.xReg = _CPU.Xreg;
                    this.processRunning.yReg = _CPU.Yreg;
                    this.processRunning.accumulator = _CPU.Acc;
                    this.processRunning.PC = _CPU.PC;
                    this.processRunning.zFlag = _CPU.Zflag;
                    this.processRunning.base = _CPU.base;
                    this.processRunning.limit = _CPU.limit;
                    _Kernel.krnTrace("that 1-3");
                    this.readyQueue.enqueue(this.processRunning);
                    _Kernel.krnTrace("that 1-4");
                    this.processRunning = this.readyQueue.dequeue();
                    _Kernel.krnTrace("that 1-5");
                    _CPU.Xreg = this.processRunning.xReg;
                    _CPU.Yreg = this.processRunning.yReg;
                    _CPU.Acc = this.processRunning.accumulator;
                    _CPU.PC = this.processRunning.PC;
                    _CPU.Zflag = this.processRunning.zFlag;
                    _CPU.base = this.processRunning.base;
                    _CPU.limit = this.processRunning.limit;
                    _timerOn = true;
                    _CPU.isExecuting = true;
                }
            }
            else {
                _Kernel.krnTrace("that 2-1");
                if (this.readyQueue.getSize() > 0) {
                    _Kernel.krnTrace("that 2-2");
                    this.processRunning = this.readyQueue.dequeue();
                    _Kernel.krnTrace("that 2-3");
                    _CPU.Xreg = this.processRunning.xReg;
                    _CPU.Yreg = this.processRunning.yReg;
                    _CPU.Acc = this.processRunning.accumulator;
                    _CPU.PC = this.processRunning.PC;
                    _CPU.Zflag = this.processRunning.zFlag;
                    _CPU.base = this.processRunning.base;
                    _CPU.limit = this.processRunning.limit;
                    _timerOn = true;
                    _CPU.isExecuting = true;
                }
                else {
                    _Kernel.krnTrace("this 2-2-1");
                    _timerOn = false;
                    _timerCount = 0;
                    _CPU.isExecuting = false;
                }
            }
        };
        scheduler.prototype.findPID = function (baseAddr) {
            var PID = -1;
            var tempQ = new TSOS.Queue();
            var PCB = null;
            if (this.processRunning != null) {
                if (this.processRunning.base == baseAddr) {
                    PID = this.processRunning.PID;
                }
            }
            if (PID == -1) {
                while (this.readyQueue.getSize() > 0) {
                    PCB = this.readyQueue.dequeue();
                    if (PCB.base == baseAddr) {
                        PID = PCB.PID;
                    }
                    tempQ.enqueue(PCB);
                }
                while (tempQ.getSize() > 0) {
                    this.readyQueue.enqueue(tempQ.dequeue());
                }
            }
            return PID;
        };
        return scheduler;
    })();
    TSOS.scheduler = scheduler;
})(TSOS || (TSOS = {}));
