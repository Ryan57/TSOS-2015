///<reference path="../globals.ts" />
///<reference path="pcb.ts" />
/**
 * Created by Ryan on 10/2/2015.
 */
var TSOS;
(function (TSOS) {
    var scheduler = (function () {
        function scheduler(processRunning, nextPID) {
            if (processRunning === void 0) { processRunning = null; }
            if (nextPID === void 0) { nextPID = 0; }
            this.processRunning = processRunning;
            this.nextPID = nextPID;
        }
        scheduler.prototype.createProcess = function (progInput) {
            // Load program, and get pcb. If program already loaded,
            // pcb is null
            var PcB = _MemoryManager.loadProgram(progInput, this.nextPID);
            // Return false if program already loaded
            if (PcB == null)
                return null;
            // Send trace message
            _Kernel.krnTrace("Created process with PID " + this.nextPID + ".");
            // Increment nextPID
            this.nextPID++;
            // Return true
            return PcB;
        };
        scheduler.prototype.executeProcess = function (pid) {
            // Check if a process is not loaded
            if (_MemoryManager.loadedPCB == null)
                // Return false
                return false;
            // Check if loaded process pid = pid passed in
            if (_MemoryManager.loadedPCB.PID != pid)
                //If not return false
                return false;
            // Set runningProcess to loadedProcess's pcb
            this.processRunning = _MemoryManager.loadedPCB;
            // Copy all register values from pcb to cpu registers
            _CPU.Xreg = this.processRunning.xReg;
            _CPU.Yreg = this.processRunning.yReg;
            _CPU.Acc = this.processRunning.accumulator;
            _CPU.PC = this.processRunning.PC;
            _CPU.Zflag = this.processRunning.zFlag;
            _CPU.base = this.processRunning.base;
            _CPU.limit = this.processRunning.limit;
            // Set loaded process to null
            _MemoryManager.loadedPCB = null;
            // Set cpu.isExecuting to true
            _CPU.isExecuting = true;
            // Trace executed process by pid
            _Kernel.krnTrace("Executed process with PID " + this.nextPID + ".");
            // Return true
            return true;
        };
        scheduler.prototype.terminateProcess = function () {
            // Check if process running
            if (this.processRunning == null)
                // If not return -1
                return null;
            /*
            // Check if pid matches running pid
            if(pid == this.processRunning.PID)
                        // If not retunr -2
                return false;
                */
            // Set is cpu.isexecuting to false
            _CPU.isExecuting = false;
            // Copy register values to pcb
            this.processRunning.xReg = _CPU.Xreg;
            this.processRunning.yReg = _CPU.Yreg;
            this.processRunning.accumulator = _CPU.Acc;
            this.processRunning.PC = _CPU.PC;
            this.processRunning.zFlag = _CPU.Zflag;
            this.processRunning.base = _CPU.base;
            this.processRunning.limit = _CPU.limit;
            // Trace terminated process by pid
            _Kernel.krnTrace("Terminating process with PID " + this.nextPID + ".");
            // Trace pcb values
            _Kernel.krnTrace(this.processRunning.toString());
            var pcb = this.processRunning;
            // Set runningProcess to null
            this.processRunning = null;
            // return 1
            return pcb;
        };
        return scheduler;
    })();
    TSOS.scheduler = scheduler;
})(TSOS || (TSOS = {}));
