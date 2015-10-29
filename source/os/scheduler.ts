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

            _Kernel.krnTrace("this 1");

            var PCB: TSOS.PCB = this.removeFromResQueue(pid);

            _Kernel.krnTrace("this 2");

            if(PCB == null)
                return false;

            this.readyQueue.enqueue(PCB);

            _Kernel.krnTrace("this 3");


            if(this.processRunning == null)
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
                _Kernel.krnTrace("that 1-1");

                if(this.readyQueue.getSize() > 0)
                {
                    _Kernel.krnTrace("that 1-2");

                    this.processRunning.xReg = _CPU.Xreg;
                    this.processRunning.yReg =  _CPU.Yreg;
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