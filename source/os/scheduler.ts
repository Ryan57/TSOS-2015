///<reference path="../globals.ts" />
///<reference path="pcb.ts" />

/**
 * Created by Ryan on 10/2/2015.
 */

module TSOS
{
    export class scheduler
    {
           constructor(public processRunning: TSOS.PCB = null, public nextPID: number = 0, public readyQueue: Queue = new Queue(),
                       public residentQueue: Queue = new Queue(), public terminatedQ: Queue = new Queue())
           {

           }

        public removeFromResQueue(PID: number) : TSOS.PCB
        {
            var tempQ: Queue = new Queue();
            var PCB: TSOS.PCB;
            var retPCB: TSOS.PCB = null;

            while(this.residentQueue.getSize() > 0)
            {
                PCB = this.residentQueue.dequeue();

                if(PID == PCB.PID)
                {
                    retPCB = PCB;
                }
                else
                {
                    tempQ.enqueue(PCB);
                }
            }

            while(tempQ.getSize() > 0)
            {
                this.residentQueue.enqueue(tempQ.dequeue());
            }

            return retPCB;
        }

        public removeFromReadyQueue(PID: number) : TSOS.PCB
        {
            var tempQ: Queue = new Queue();
            var PCB: TSOS.PCB;
            var retPCB: TSOS.PCB = null;

            while(this.readyQueue.getSize() > 0)
            {
                PCB = this.readyQueue.dequeue();

                if(PID == PCB.PID)
                {
                    retPCB = PCB;
                }
                else
                {
                    tempQ.enqueue(PCB);
                }
            }

            while(tempQ.getSize() > 0)
            {
                this.readyQueue.enqueue(tempQ.dequeue());
            }

            return retPCB;
        }

           public createProcess(progInput: string) : TSOS.PCB
           {

               // Load program, and get pcb. If program already loaded,
               // pcb is null
               var PcB: TSOS.PCB =_MemoryManager.loadProgram(progInput, this.nextPID)

               // Return false if program already loaded
               if( PcB == null )
                    return null;

               this.residentQueue.enqueue(PcB);

               // Send trace message
               _Kernel.krnTrace("Created process with PID " + this.nextPID + ".");

               // Increment nextPID
               this.nextPID++;

               // Return true
               return PcB;
           }

        public executeProcess(pid : number) : boolean
        {
           if(this.residentQueue.getSize() == 0)
                return false;

            var PCB: TSOS.PCB = this.removeFromResQueue(pid);

            if(PCB == null)
                return false;

            this.readyQueue.enqueue(PCB);
            TSOS.Control.updateReadyQueueTable();


            if(this.processRunning == null)
                this.contextSwitch();


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
    }

    // Shell comman runall engues interrupt new interrupt EXECUTE_ALL_PROCESS_IRQ
    // with null as param. Kernel handles this interrupt by calling this function,
    // which returns how many process it executed, and messages back to user
    // that it executed X processes

        public executeAll() : number
        {
            // Create a pcb var
            var PCB: TSOS.PCB = this.removeFromResQueue(this.residentQueue.getSize());

            // Create running process counter
            var processRunningCounter;

            // Cycle through resident queue while(this.residentQueue.getSize() > 0 )
            while(this.residentQueue.getSize() > 0)
            {
                PCB = this.residentQueue.dequeue();   // Dequeue pcb from resident queue at set to pcb variable
                this.readyQueue.enqueue(PCB);             // Enqueu pcb variable into ready queue
                processRunningCounter++;                  // Increment running process counter
            }

            if(this.processRunning == null)
                this.contextSwitch();                         // Call context switch

            _Kernel.krnTrace("Executed process with PID " + this.nextPID + ".");    // Trace executed process by pid
            return processRunningCounter;                                           // Return running process counter
        }

        public terminateProcess(pid : number): TSOS.PCB
        {
            var PCB: TSOS.PCB = null;

            if(this.processRunning.PID == pid)
            {
                PCB = this.processRunning;
                this.terminatedQ.enqueue(PCB);
                this.processRunning = null;
                this.contextSwitch();
            }
            else
            {
                PCB = this.removeFromReadyQueue(pid);
                TSOS.Control.updateReadyQueueTable();


                if(PCB != null)
                {
                    this.terminatedQ.enqueue(PCB);
                }
            }

            if(PCB != null)
            {
                _MemoryManager.unmarkPartition(PCB.base);

                // Trace terminated process by pid
                _Kernel.krnTrace("Terminating process with PID " + PCB.PID + ".");
                // Trace pcb values
                _Kernel.krnTrace(PCB.toString());
            }
            // return 1
            return PCB;
        }

        public contextSwitch()
        {
            _Kernel.krnTrace("Performing context switch.");

            if(this.processRunning != null)
            {

                if(this.readyQueue.getSize() > 0)
                {

                    this.processRunning.xReg = _CPU.Xreg;
                    this.processRunning.yReg =  _CPU.Yreg;
                    this.processRunning.accumulator = _CPU.Acc;
                    this.processRunning.PC = _CPU.PC;
                    this.processRunning.zFlag = _CPU.Zflag;
                    this.processRunning.base = _CPU.base;
                    this.processRunning.limit = _CPU.limit;


                    this.readyQueue.enqueue(this.processRunning);


                    this.processRunning = this.readyQueue.dequeue();


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
            else
            {
                _Kernel.krnTrace("that 2-1");

                if(this.readyQueue.getSize() > 0)
                {
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
                else
                {
                    _Kernel.krnTrace("this 2-2-1");

                    _timerOn = false;
                    _timerCount = 0;
                    _CPU.isExecuting = false;
                }
            }
            TSOS.Control.updateRunProcessTable();
            TSOS.Control.updateReadyQueueTable();

        }

        public findPID(baseAddr: number) : number
        {
            var PID = -1;
            var tempQ = new Queue();
            var PCB = null;

            if(this.processRunning != null)
            {

                if(this.processRunning.base == baseAddr)
                {
                PID = this.processRunning.PID;
                }

            }
            if(PID == -1)
            {
                while(this.readyQueue.getSize() > 0)
                {
                    PCB = this.readyQueue.dequeue();
                        if(PCB.base == baseAddr)
                        {
                            PID = PCB.PID;
                        }
                    tempQ.enqueue(PCB);
                }

                while(tempQ.getSize() > 0)
                {
                    this.readyQueue.enqueue(tempQ.dequeue());
                }
            }

            return PID;
        }
    }
}