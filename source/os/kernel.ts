///<reference path="../globals.ts" />
///<reference path="queue.ts" />
///<reference path="pcb.ts" />

/* ------------
     Kernel.ts

     Requires globals.ts
              queue.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

            // Initialize the console.
            _Console = new Console();          // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            //
            // ... more?
            //

            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();

            // Create memory manager
            _MemoryManager = new TSOS.MemoryManager();
            _Scheduler = new TSOS.scheduler();

            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }

        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        }


        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                           */

            // Check for an interrupt, are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed. {
                _CPU.cycle();
            } else {                      // If there are no interrupts and there is nothing being executed then just be idle. {
                this.krnTrace("Idle");
            }
        }


        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();              // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;

                case CREATE_PROCESS_IRQ:
                     var pcb : TSOS.PCB = _Scheduler.createProcess(params);
                    if(pcb == null)
                        _OsShell.outPutMsg("Process is already loaded. ");
                    else
                        _OsShell.outPutMsg("Process has been loaded with PID: " + pcb.PID.toString());
                     break;

                case EXECUTE_PROCESS_IRQ:
                    var retVal : boolean = _Scheduler.executeProcess(params);

                    if(retVal == false)
                        _OsShell.outPutMsg("No process loaded with PID: " + params.toString());
                    else
                        _OsShell.outPutMsg("Executing process with PID: " + params.toString());
                     break;

                case TERMINATE_PROCESS_IRQ:
                    var pcb : TSOS.PCB =_Scheduler.terminateProcess(params);

                    if(pcb != null)
                        _OsShell.outPutMsg("Terminating process with PID: " + pcb.PID.toString());
                    else
                        _OsShell.outPutMsg("No process with PID: " + pcb.PID.toString() + " is running.");

                    break;

                case MEMORY_ACCESS_VIOLATION_IRQ:
                    _OsShell.outPutMsg("Memory access violation to address 0x" + params[0].toString(16));
                    _Scheduler.terminateProcess(_Scheduler.findPID(params[1]));
                    break;

                case OVERFLOW_IRQ:
                    _OsShell.outPutMsg("Arithmatic overflow at instruction 0x" + params[0].toString(16));
                    _Scheduler.terminateProcess(_Scheduler.findPID(params[1]));
                    break;

                case INVALID_OP_CODE_IRQ:
                    _OsShell.outPutMsg("Invalid Op Code 0x" + params[0].toString(16));
                    _Scheduler.terminateProcess(_Scheduler.findPID(params[1]));
                    break;

                case UNEXPECTED_TERMINATION_IRQ:
                    _OsShell.outPutMsg("Unexpected program termination.");
                    _Scheduler.terminateProcess(_Scheduler.findPID(params));
                    break;

                case PRINT_TEXT_IRQ:
                    _OsShell.outPutMsg(params);
                    break;

                case PRINT_NUMBER_IRQ:
                    _OsShell.outPutMsg(params.toString());
                    break;

                case CONTEXT_SWITCH_IRQ:
                    _Scheduler.contextSwitch();
                    break;

                case CREATE_ALL_PROCESSES_IRQ:
                    var availablePartitions = _MemoryManager.availablePartitions();
                    for(var i = 0; i < availablePartitions; i++)
                    {
                        _KernelInterruptQueue.enqueue(new Interrupt(CREATE_PROCESS_IRQ,params));
                    }
                    break;

                case EXECUTE_ALL_PROCESSES_IRQ:
                    var PID = null;
                    for(var i = 0; i < _Scheduler.residentQueue.getSize(); i++)
                    {
                        PID = _Scheduler.residentQueue.q[i].PID;
                        _KernelInterruptQueue.enqueue(new Interrupt(EXECUTE_PROCESS_IRQ,PID));
                    }
                    break;

                case CLEAR_PARTITION_IRQ:
                    if(_Scheduler.processRunning != null)
                    {
                        _OsShell.outPutMsg("Cannot clear memory while memory is in use.");
                    }
                    else {
                        _MemoryManager.clrAllPartitions();
                        _OsShell.outPutMsg("All memory has been cleared.");
                    }
                    break;

                case QUANTUM_CHANGE_IRQ:
                    if(params <= 0)
                    {
                        _OsShell.outPutMsg("Invalid quantum.");
                    }
                    else {
                        _quantum = params;
                        _OsShell.outPutMsg("Quantum changed to " + params.toString() + ".");
                    }
                    break;

                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }

        public krnTimerISR() {
            // Increase timer counter
            _timerCount++;

            if(_timerCount >= _quantum)
            {
                _KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, null));
                _timerCount = 0;
            }
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile

        public printText(text : string): void {
            _KernelInterruptQueue.enqueue(new Interrupt(PRINT_TEXT_IRQ,text));
        }

        public printNumber(num : number): void {
            _KernelInterruptQueue.enqueue(new Interrupt(PRINT_NUMBER_IRQ,num));
        }

        public terminateProcessFromBase(base : number)
        {
            var PID = _Scheduler.findPID(base);
            _KernelInterruptQueue.enqueue(new Interrupt(TERMINATE_PROCESS_IRQ,PID));

        }

        public terminateProcessFromPID(PID : number)
        {
            _KernelInterruptQueue.enqueue(new Interrupt(TERMINATE_PROCESS_IRQ,PID));
        }

        public loadAll(input : string): void
        {
            _KernelInterruptQueue.enqueue(new Interrupt(CREATE_ALL_PROCESSES_IRQ,input));
        }

        public runAll(): void
        {
            _KernelInterruptQueue.enqueue(new Interrupt(EXECUTE_ALL_PROCESSES_IRQ,null));
        }

        public quantumChange(quantum : number): void
        {
            _KernelInterruptQueue.enqueue(new Interrupt(QUANTUM_CHANGE_IRQ,quantum));
        }

        public clearMem(): void
        {
            _KernelInterruptQueue.enqueue(new Interrupt(CLEAR_PARTITION_IRQ,null));
        }

        public displayPS(): void
        {
            var message1 = "The running processes by PID are: ";
            var message2 = "There are currently no running processes.";
            var PSarray = [];

            if(_Scheduler.processRunning != null)
            {
                PSarray.push(_Scheduler.processRunning.PID);

                for(var i = 0; i < _Scheduler.readyQueue.getSize(); i++)
                {
                    PSarray.push(_Scheduler.readyQueue.q[i].PID);
                }
            }

            if(PSarray.length > 0)
            {
                for(var i = 0; i < PSarray.length; i++)
                {
                    if(i != 0)
                    message1 += ", ";

                   message1 += PSarray[i].toString();
                }
                _StdOut.putText(message1);
            }
            else
            {
                _StdOut.putText(message2);
            }
        }
        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would lag the browser very quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }

        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)

            _Console.darthScreen(msg);

            this.krnShutdown();

        }
    }
}
