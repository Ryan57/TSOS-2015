///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />
/* ------------
     Control.ts

     Requires globals.ts.

     Routines for the hardware simulation, NOT for our client OS itself.
     These are static because we are never going to instantiate them, because they represent the hardware.
     In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
     is the "bare metal" (so to speak) for which we write code that hosts our client OS.
     But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
     in both the host and client environments.

     This (and other host/simulation scripts) is the only place that we should see "web" code, such as
     DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
//
// Control Services
//
var TSOS;
(function (TSOS) {
    var Control = (function () {
        function Control() {
        }
        Control.hostInit = function () {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.
            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = document.getElementById("display");
            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext("2d");
            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            TSOS.CanvasTextFunctions.enable(_DrawingContext); // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.
            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("taHostLog").value = "";
            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById("btnStartOS").focus();
            this.hostCurStat("stand-by");
            // Check for our testing and enrichment core, which
            // may be referenced here (from index.html) as function Glados().
            if (typeof Glados === "function") {
                // function Glados() is here, so instantiate Her into
                // the global (and properly capitalized) _GLaDOS variable.
                _GLaDOS = new Glados();
                _GLaDOS.init();
            }
        };
        Control.hostLog = function (msg, source) {
            if (source === void 0) { source = "?"; }
            // Note the OS CLOCK.
            var clock = _OSclock;
            // Note the REAL clock in milliseconds since January 1, 1970.
            var now = new Date().getTime();
            // Build the log string.
            var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now + " })" + "\n";
            // Update the log console.
            var taLog = document.getElementById("taHostLog");
            taLog.value = str + taLog.value;
            // TODO in the future: Optionally update a log database or some streaming service.
        };
        //
        // Host Events
        //
        Control.hostBtnStartOS_click = function (btn) {
            // Disable the (passed-in) start button...
            btn.disabled = true;
            // .. enable the Halt and Reset buttons ...
            document.getElementById("btnHaltOS").disabled = false;
            document.getElementById("btnReset").disabled = false;
            // .. set focus on the OS console display ...
            document.getElementById("display").focus();
            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new TSOS.Cpu(); // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init(); //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.
            _Memory = new TSOS.memory(); //Instantiate memory object
            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(TSOS.Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new TSOS.Kernel();
            _Kernel.krnBootstrap(); // _GLaDOS.afterStartup() will get called in there, if configured.
            this.hostCurStat("Started");
            this.createMemTable();
            this.createCPUTable();
            this.createRunProcessTable();
            this.createReadyQueueTable();
        };
        Control.hostBtnHaltOS_click = function (btn) {
            Control.hostLog("Emergency halt", "host");
            Control.hostLog("Attempting Kernel shutdown.", "host");
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);
            // TODO: Is there anything else we need to do here?
            this.hostCurStat("Halted");
        };
        Control.hostBtnReset_click = function (btn) {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload(true);
            // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
            // be reloaded from the server. If it is false or not specified the browser may reload the
            // page from its cache, which is not what we want.
        };
        Control.hostCurStat = function (status) {
            var curDate = new Date();
            document.getElementById("statusdisplay").innerHTML = curDate.toDateString() + " "
                + curDate.toTimeString() + " OS Status- " + status;
        };
        Control.createMemTable = function () {
            var memHeader = 0;
            var memTable = document.getElementById("MemTable");
            var memRow = memTable.insertRow();
            var memCell = memRow.insertCell();
            memCell.innerHTML = "<b>0x0</b>";
            // For loop cycling through all memory ( 0 to mem max)
            for (var i = 0; i < _MemMax; i++) {
                if (i % 8 == 0 && i != 0) {
                    memHeader += 8;
                    memRow = memTable.insertRow();
                    memCell = memRow.insertCell();
                    memCell.innerHTML = "<b> 0x" + TSOS.Utils.padWithZeros(memHeader.toString(16), 4) + "</b>";
                }
                memCell = memRow.insertCell();
                memCell.innerHTML = TSOS.Utils.padWithZeros(_Memory.getMem(i).toString(16), 2);
            }
        };
        Control.updateMemTable = function () {
            var memTable = document.getElementById("MemTable");
            var memRow = null;
            var memCell = null;
            var rowNum = 0;
            var cellNum = 1;
            for (var i = 0; i < _MemMax; i++) {
                if (i % 8 == 0) {
                    memRow = memTable.rows.item(rowNum);
                    rowNum++;
                    cellNum = 1;
                }
                memCell = memRow.cells.item(cellNum);
                memCell.innerHTML = TSOS.Utils.padWithZeros(_Memory.getMem(i).toString(16), 2);
                cellNum++;
            }
        };
        // Updates cpu display table
        Control.updateCPUTable = function () {
            // Inits
            var tbl = document.getElementById("CPU");
            var row = tbl.rows.item(1);
            // Set register data
            row.cells.item(0).innerHTML = TSOS.Utils.padWithZeros(_CPU.PC.toString(16), 2);
            row.cells.item(1).innerHTML = TSOS.Utils.padWithZeros(_CPU.Acc.toString(16), 2);
            row.cells.item(2).innerHTML = TSOS.Utils.padWithZeros(_CPU.Xreg.toString(16), 2);
            row.cells.item(3).innerHTML = TSOS.Utils.padWithZeros(_CPU.Yreg.toString(16), 2);
            row.cells.item(4).innerHTML = TSOS.Utils.padWithZeros(_CPU.Zflag.toString(16), 2);
            row.cells.item(5).innerHTML = TSOS.Utils.padWithZeros(_CPU.base.toString(16), 4);
            row.cells.item(6).innerHTML = TSOS.Utils.padWithZeros(_CPU.limit.toString(16), 4);
        };
        Control.createCPUTable = function () {
            var tbl = document.getElementById("CPU");
            var hdr = tbl.insertRow();
            var row = tbl.insertRow();
            // Create header
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'X Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Y Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Z Flag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            // Create cpu reg data
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.PC.toString(16), 2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Acc.toString(16), 2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Xreg.toString(16), 2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Yreg.toString(16), 2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Zflag.toString(16), 2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.base.toString(16), 4);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.limit.toString(16), 4);
        };
        Control.createRunProcessTable = function () {
            var tbl = document.getElementById("RunningProcess");
            var hdr = tbl.insertRow();
            var row = tbl.insertRow();
            hdr.insertCell().innerHTML = '<b>' + 'PID' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'X Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Y Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Z Flag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'TimeStamp' + '</b>';
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
        };
        Control.updateRunProcessTable = function () {
            // Inits
            var tbl = document.getElementById("RunningProcess");
            var row = tbl.rows.item(1);
            var PID = "&nbsp";
            var PC = "&nbsp";
            var Acc = "&nbsp";
            var Xreg = "&nbsp";
            var Yreg = "&nbsp";
            var Zflag = "&nbsp";
            var base = "&nbsp";
            var limit = "&nbsp";
            var timeStamp = "&nbsp";
            if (_Scheduler.processRunning != null) {
                PID = TSOS.Utils.padWithZeros(_Scheduler.processRunning.PID.toString(16), 2);
                PC = TSOS.Utils.padWithZeros(_Scheduler.processRunning.PC.toString(16), 2);
                Acc = TSOS.Utils.padWithZeros(_Scheduler.processRunning.accumulator.toString(16), 2);
                Xreg = TSOS.Utils.padWithZeros(_Scheduler.processRunning.xReg.toString(16), 2);
                Yreg = TSOS.Utils.padWithZeros(_Scheduler.processRunning.yReg.toString(16), 2);
                Zflag = TSOS.Utils.padWithZeros(_Scheduler.processRunning.zFlag.toString(16), 2);
                base = TSOS.Utils.padWithZeros(_Scheduler.processRunning.base.toString(16), 4);
                limit = TSOS.Utils.padWithZeros(_Scheduler.processRunning.limit.toString(16), 4);
                timeStamp = TSOS.Utils.formatTimeString(_Scheduler.processRunning.timeStamp);
            }
            // Set register data
            row.cells.item(0).innerHTML = PID;
            row.cells.item(1).innerHTML = PC;
            row.cells.item(2).innerHTML = Acc;
            row.cells.item(3).innerHTML = Xreg;
            row.cells.item(4).innerHTML = Yreg;
            row.cells.item(5).innerHTML = Zflag;
            row.cells.item(6).innerHTML = base;
            row.cells.item(7).innerHTML = limit;
            row.cells.item(8).innerHTML = timeStamp;
        };
        Control.createReadyQueueTable = function () {
            var tbl = document.getElementById("ReadyQueue");
            var hdr = tbl.insertRow();
            var row = tbl.insertRow();
            hdr.insertCell().innerHTML = '<b>' + 'PID' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'X Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Y Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Z Flag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'TimeStamp' + '</b>';
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row = tbl.insertRow();
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row = tbl.insertRow();
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
        };
        Control.updateReadyQueueTable = function () {
            var tbl = document.getElementById("ReadyQueue");
            var row = tbl.rows.item(1);
            var PCB;
            var insert = 0;
            var rowIndex = 2;
            for (var i = 0; i < _Scheduler.readyQueue.getSize(); i++) {
                PCB = _Scheduler.readyQueue.q[i];
                row.cells.item(0).innerHTML = TSOS.Utils.padWithZeros(PCB.PID.toString(16), 2);
                row.cells.item(1).innerHTML = TSOS.Utils.padWithZeros(PCB.PC.toString(16), 2);
                row.cells.item(2).innerHTML = TSOS.Utils.padWithZeros(PCB.accumulator.toString(16), 2);
                row.cells.item(3).innerHTML = TSOS.Utils.padWithZeros(PCB.xReg.toString(16), 2);
                row.cells.item(4).innerHTML = TSOS.Utils.padWithZeros(PCB.yReg.toString(16), 2);
                row.cells.item(5).innerHTML = TSOS.Utils.padWithZeros(PCB.zFlag.toString(16), 2);
                row.cells.item(6).innerHTML = TSOS.Utils.padWithZeros(PCB.base.toString(16), 4);
                row.cells.item(7).innerHTML = TSOS.Utils.padWithZeros(PCB.limit.toString(16), 4);
                row.cells.item(8).innerHTML = TSOS.Utils.formatTimeString(PCB.timeStamp);
                if (i < 2) {
                    row = tbl.rows.item(rowIndex);
                    rowIndex++;
                }
                insert++;
            }
            for (var n = insert; n < 3; n++) {
                row.cells.item(0).innerHTML = "&nbsp";
                row.cells.item(1).innerHTML = "&nbsp";
                row.cells.item(2).innerHTML = "&nbsp";
                row.cells.item(3).innerHTML = "&nbsp";
                row.cells.item(4).innerHTML = "&nbsp";
                row.cells.item(5).innerHTML = "&nbsp";
                row.cells.item(6).innerHTML = "&nbsp";
                row.cells.item(7).innerHTML = "&nbsp";
                row.cells.item(8).innerHTML = "&nbsp";
                if (i < 2) {
                    row = tbl.rows.item(rowIndex);
                    rowIndex++;
                }
            }
        };
        return Control;
    })();
    TSOS.Control = Control;
})(TSOS || (TSOS = {}));
