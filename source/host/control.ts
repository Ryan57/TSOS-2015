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

            this.hostCurStat("Started");


            this.createMemTable();
            this.createCPUTable();

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
    }
}
