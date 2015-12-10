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
module TSOS {

    export class Control {

        public static hostInit():void {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.

            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = <HTMLCanvasElement>document.getElementById("display");

            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext("2d");

            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            CanvasTextFunctions.enable(_DrawingContext);   // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.

            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            (<HTMLInputElement> document.getElementById("taHostLog")).value = "";

            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            (<HTMLInputElement> document.getElementById("btnStartOS")).focus();

            this.hostCurStat("stand-by");

            // Check for our testing and enrichment core, which
            // may be referenced here (from index.html) as function Glados().
            if (typeof Glados === "function") {
                // function Glados() is here, so instantiate Her into
                // the global (and properly capitalized) _GLaDOS variable.
                _GLaDOS = new Glados();
                _GLaDOS.init();
            }
        }

        public static hostLog(msg:string, source:string = "?"):void {
            // Note the OS CLOCK.
            var clock:number = _OSclock;

            // Note the REAL clock in milliseconds since January 1, 1970.
            var now:number = new Date().getTime();

            // Build the log string.
            var str:string = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now + " })" + "\n";

            // Update the log console.
            var taLog = <HTMLInputElement> document.getElementById("taHostLog");
            taLog.value = str + taLog.value;


            // TODO in the future: Optionally update a log database or some streaming service.
        }


        //
        // Host Events
        //
        public static hostBtnStartOS_click(btn):void {
            // Disable the (passed-in) start button...
            btn.disabled = true;

            // .. enable the Halt and Reset buttons ...
            (<HTMLButtonElement>document.getElementById("btnHaltOS")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnReset")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnTrace")).disabled = false;
            (<HTMLButtonElement>document.getElementById("btnStep")).disabled = false;


            // .. set focus on the OS console display ...
            document.getElementById("display").focus();

            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new Cpu();  // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init();       //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.

            _Memory = new TSOS.memory();  //Instantiate memory object

            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new Kernel();
            _Kernel.krnBootstrap();  // _GLaDOS.afterStartup() will get called in there, if configured.

            _HardDrive = new TSOS.HDriveDeviceDriver(4, 8, 8);

            this.createHDtable();

            this.hostCurStat("Started");


            this.createMemTable();
            this.createCPUTable();
            this.createRunProcessTable();
            this.createReadyQueueTable();

        }

        public static traceMode_click(btn): void
        {
            if(_TraceMode)
            {
                _TraceMode = false;
                (<HTMLInputElement>document.getElementById("btnTrace")).value = "TraceModeOn";
                (<HTMLInputElement>document.getElementById("btnStep")).disabled = true;
                _NextStep = false;
            }
            else {
                _TraceMode = true;
                (<HTMLInputElement>document.getElementById("btnTrace")).value = "TraceModeOff";
                (<HTMLInputElement>document.getElementById("btnStep")).disabled = false;
                _NextStep = false;

            }
        }

        public static step_click(btn): void
        {
            _NextStep = true;
        }

        public static hostBtnHaltOS_click(btn):void {
            Control.hostLog("Emergency halt", "host");
            Control.hostLog("Attempting Kernel shutdown.", "host");
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);
            // TODO: Is there anything else we need to do here?
            this.hostCurStat("Halted");
        }

        public static hostBtnReset_click(btn):void {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload(true);
            // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
            // be reloaded from the server. If it is false or not specified the browser may reload the
            // page from its cache, which is not what we want.
        }

        public static hostCurStat(status:string):void {
            var curDate = new Date();
            (<HTMLElement>document.getElementById("statusdisplay")).innerHTML = curDate.toDateString() + " "
                + curDate.toTimeString() + " OS Status- " + status;


        }

        public static createMemTable():void {
            var memHeader: number = 0;
            var memTable:HTMLTableElement = (<HTMLTableElement>document.getElementById("MemTable"));
            var memRow:HTMLTableRowElement = (<HTMLTableRowElement>memTable.insertRow());
            var memCell:HTMLTableCellElement = (<HTMLTableCellElement>memRow.insertCell());
            memCell.innerHTML = "<b>0x0</b>";

            // For loop cycling through all memory ( 0 to mem max)
            for (var i = 0; i < _MemMax; i++)
            {
             if(i % 8 == 0 && i != 0)
                {
                memHeader += 8;
                memRow = (<HTMLTableRowElement>memTable.insertRow());
                memCell = (<HTMLTableCellElement>memRow.insertCell());
                memCell.innerHTML = "<b> 0x" + TSOS.Utils.padWithZeros(memHeader.toString(16),4) + "</b>"
                }

                memCell = (<HTMLTableCellElement>memRow.insertCell());
                memCell.innerHTML = TSOS.Utils.padWithZeros(_Memory.getMem(i).toString(16),2);

            }

        }

        public static updateMemTable():void {
            var memTable:HTMLTableElement = (<HTMLTableElement>document.getElementById("MemTable"));
            var memRow:HTMLTableRowElement = null;
            var memCell:HTMLTableCellElement = null;
            var rowNum: number = 0;
            var cellNum: number = 1;

            for (var i = 0; i < _MemMax; i++)
            {
                if(i % 8 == 0)
                {
                    memRow = (<HTMLTableRowElement>memTable.rows.item(rowNum));
                    rowNum++;
                    cellNum = 1;
                }

                memCell = (<HTMLTableCellElement>memRow.cells.item(cellNum));
                memCell.innerHTML = TSOS.Utils.padWithZeros(_Memory.getMem(i).toString(16),2);
                cellNum++;

            }
        }

        // Updates cpu display table
        public static updateCPUTable() : void
        {
            // Inits
            var tbl = (<HTMLTableElement>document.getElementById("CPU"));
            var row = (<HTMLTableRowElement>tbl.rows.item(1));

            // Set register data
            (<HTMLTableCellElement>row.cells.item(0)).innerHTML = TSOS.Utils.padWithZeros(_CPU.PC.toString(16),2);
            (<HTMLTableCellElement>row.cells.item(1)).innerHTML = TSOS.Utils.padWithZeros(_CPU.Acc.toString(16),2);
            (<HTMLTableCellElement>row.cells.item(2)).innerHTML = TSOS.Utils.padWithZeros(_CPU.Xreg.toString(16),2);
            (<HTMLTableCellElement>row.cells.item(3)).innerHTML = TSOS.Utils.padWithZeros(_CPU.Yreg.toString(16),2);
            (<HTMLTableCellElement>row.cells.item(4)).innerHTML = TSOS.Utils.padWithZeros(_CPU.Zflag.toString(16),2);
            (<HTMLTableCellElement>row.cells.item(5)).innerHTML = TSOS.Utils.padWithZeros(_CPU.base.toString(16),4);
            (<HTMLTableCellElement>row.cells.item(6)).innerHTML = TSOS.Utils.padWithZeros(_CPU.limit.toString(16),4);

        }


        public static createCPUTable() : void
        {
            var tbl = (<HTMLTableElement>document.getElementById("CPU"));
            var hdr = (<HTMLTableRowElement>tbl.insertRow());
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.insertRow());

            // Create header
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'X Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Y Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Z Flag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';

            // Create cpu reg data
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.PC.toString(16),2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Acc.toString(16),2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Xreg.toString(16),2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Yreg.toString(16),2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.Zflag.toString(16),2);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.base.toString(16),4);
            row.insertCell().innerHTML = TSOS.Utils.padWithZeros(_CPU.limit.toString(16),4);
        }

        public static createRunProcessTable() : void
        {
            var tbl = (<HTMLTableElement>document.getElementById("RunningProcess"));
            var hdr = (<HTMLTableRowElement>tbl.insertRow());
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.insertRow());

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

        }

        public static updateRunProcessTable() : void
        {
            // Inits
            var tbl = (<HTMLTableElement>document.getElementById("RunningProcess"));
            var row = (<HTMLTableRowElement>tbl.rows.item(1));
            var PID = "&nbsp";
            var PC = "&nbsp";
            var Acc = "&nbsp";
            var Xreg = "&nbsp";
            var Yreg = "&nbsp";
            var Zflag = "&nbsp";
            var base = "&nbsp";
            var limit = "&nbsp";
            var timeStamp = "&nbsp";

            if(_Scheduler.processRunning != null)
            {
                PID = TSOS.Utils.padWithZeros(_Scheduler.processRunning.PID.toString(16),2);
                PC = TSOS.Utils.padWithZeros(_Scheduler.processRunning.PC.toString(16),2);
                Acc = TSOS.Utils.padWithZeros(_Scheduler.processRunning.accumulator.toString(16),2);
                Xreg = TSOS.Utils.padWithZeros(_Scheduler.processRunning.xReg.toString(16),2);
                Yreg = TSOS.Utils.padWithZeros(_Scheduler.processRunning.yReg.toString(16),2);
                Zflag = TSOS.Utils.padWithZeros(_Scheduler.processRunning.zFlag.toString(16),2);
                base = TSOS.Utils.padWithZeros(_Scheduler.processRunning.base.toString(16),4);
                limit = TSOS.Utils.padWithZeros(_Scheduler.processRunning.limit.toString(16),4);
                timeStamp = TSOS.Utils.formatTimeString(_Scheduler.processRunning.timeStamp);


            }

            // Set register data
            (<HTMLTableCellElement>row.cells.item(0)).innerHTML = PID;
            (<HTMLTableCellElement>row.cells.item(1)).innerHTML = PC;
            (<HTMLTableCellElement>row.cells.item(2)).innerHTML = Acc;
            (<HTMLTableCellElement>row.cells.item(3)).innerHTML = Xreg;
            (<HTMLTableCellElement>row.cells.item(4)).innerHTML = Yreg;
            (<HTMLTableCellElement>row.cells.item(5)).innerHTML = Zflag;
            (<HTMLTableCellElement>row.cells.item(6)).innerHTML = base;
            (<HTMLTableCellElement>row.cells.item(7)).innerHTML = limit;
            (<HTMLTableCellElement>row.cells.item(8)).innerHTML = timeStamp;

        }

        public static createReadyQueueTable() : void
        {
            var tbl = (<HTMLTableElement>document.getElementById("ReadyQueue"));
            var hdr = (<HTMLTableRowElement>tbl.insertRow());
            var row : HTMLTableRowElement = (<HTMLTableRowElement>tbl.insertRow());

            hdr.insertCell().innerHTML = '<b>' + 'PID' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'PC' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Acc' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'X Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Y Reg' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Z Flag' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Base' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Limit' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'OnHD' + '</b>';
            hdr.insertCell().innerHTML = '<b>' + 'Priority' + '</b>';
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
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";

            row = (<HTMLTableRowElement>tbl.insertRow());
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";

            row = (<HTMLTableRowElement>tbl.insertRow());
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
            row.insertCell().innerHTML = "&nbsp";
        }

        public static updateReadyQueueTable() : void {
            var tbl = (<HTMLTableElement>document.getElementById("ReadyQueue"));
            var row = null;
            var PCB;
            var insert = 0;
            var rowIndex = 2;
            var endOfRows = false;
   _Kernel.krnTrace("CTRL - redQ before " + tbl.rows.length.toString());

            while(tbl.rows.length > 1){
                tbl.deleteRow(tbl.rows.length - 1);
            }
 _Kernel.krnTrace("CTRL - redQ after " + _Scheduler.readyQueue.getSize().toString());

            for (var i = 0; i < _Scheduler.readyQueue.getSize(); i++) {
                PCB = _Scheduler.readyQueue.q[i];
                row = (<HTMLTableRowElement>tbl.insertRow());
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.PID.toString(16), 2);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.PC.toString(16), 2);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.accumulator.toString(16), 2);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.xReg.toString(16), 2);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.yReg.toString(16), 2);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.zFlag.toString(16), 2);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.base.toString(16), 4);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.limit.toString(16), 4);
                if (PCB.onHD)
                    (<HTMLTableCellElement>row.insertCell()).innerHTML = "true";
                else
                    (<HTMLTableCellElement>row.insertCell()).innerHTML = "false";


                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.padWithZeros(PCB.priority.toString(), 2);
                (<HTMLTableCellElement>row.insertCell()).innerHTML = TSOS.Utils.formatTimeString(PCB.timeStamp);

            }

        }



        public static createHDtable()
        {
            var tbl = (<HTMLTableElement>document.getElementById("HardDriveTable"));
            var row = (<HTMLTableRowElement>tbl.insertRow());
            var cell = null;
            var FileBlock = new TSOS.FileBlock();
                (<HTMLTableCellElement>row.insertCell()).innerHTML = "Location";
                (<HTMLTableCellElement>row.insertCell()).innerHTML = "In Use";
                (<HTMLTableCellElement>row.insertCell()).innerHTML = "T";
                (<HTMLTableCellElement>row.insertCell()).innerHTML = "S";
                (<HTMLTableCellElement>row.insertCell()).innerHTML = "B";

            for(var i = 0; i < 60; i++)
            {
                (<HTMLTableCellElement>row.insertCell()).innerHTML = (i+1).toString();
            }

            for(var t = 0; t < _HardDrive.tracks; t++)
            {
                for(var s = 0; s < _HardDrive.sectors; s++)
                {
                    for(var b = 0; b < _HardDrive.secBlock; b++)
                    {
                        row = (<HTMLTableRowElement>tbl.insertRow());
                        row.insertCell().innerHTML = t.toString() + '.' + s.toString() + '.' + b.toString();
                        FileBlock.loadBlock(t, s, b);

                        for(var i = 0; i < 64; i++)
                        {
                            (<HTMLTableCellElement>row.insertCell()).innerHTML = FileBlock.getByte(i).toString();
                        }
                    }
                }
            }

        }

        public static updateHDtable()
        {
            var tbl = (<HTMLTableElement>document.getElementById("HardDriveTable"));
            var row = null;
            var fBlock = new TSOS.FileBlock();
            var rowInt : number = 1;

            for(var t = 0; t < _HardDrive.tracks; t++) {
                for (var s = 0; s < _HardDrive.sectors; s++) {
                    for (var b = 0; b < _HardDrive.secBlock; b++) {
                        fBlock.loadBlock(t, s, b);
                        row = (<HTMLTableRowElement>tbl.rows[rowInt]);
                        rowInt++;

                        (<HTMLTableCellElement>row.cells[1]).innerHTML = fBlock.inUse ? "01" : "00";
                        (<HTMLTableCellElement>row.cells[2]).innerHTML = TSOS.Utils.padWithZeros(fBlock.track.toString(), 2);
                        (<HTMLTableCellElement>row.cells[3]).innerHTML = TSOS.Utils.padWithZeros(fBlock.sector.toString(), 2);
                        (<HTMLTableCellElement>row.cells[4]).innerHTML = TSOS.Utils.padWithZeros(fBlock.block.toString(), 2);

                        for(var i = 4; i < 64; i++)
                        {
                            (<HTMLTableCellElement>row.cells[i + 1]).innerHTML = TSOS.Utils.padWithZeros(fBlock.getByte(i).toString(16), 2);
                        }
                    }
                }
            }

        }
    }
}
