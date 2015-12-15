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

           public createProcess(progInput: string, priority : number) : TSOS.PCB
           {

               // Load program, and get pcb. If program already loaded,
               // pcb is null
               var PcB: TSOS.PCB =_MemoryManager.loadProgram(progInput, this.nextPID);
               var ret = 0;

               // Return false if program already loaded
               if( PcB == null ){
                   if(_HardDrive.isFormatted)
                   {
                       PcB = new TSOS.PCB();
                       PcB.PID = this.nextPID;
                       var readIndex = 0;
                       var byte = "";
                       var data = [];
                       var progInputBytes = progInput.split(' ');

                       for(var i = 0; i < 256; i++)
                       {
                           if(readIndex < progInputBytes.length)
                           {
                               byte = progInputBytes[readIndex];
                               if(byte.length == 0)
                               {
                                   byte += '0';
                               }
                               readIndex++;
                           }
                           else {
                               byte = '0';
                           }

                           var num = parseInt(byte, 16);

                           data.push(parseInt(byte, 16));
                       }

                       ret = this.createSwapFile(data, this.nextPID);

                       if(ret != HDD_SUCCESS)
                            return null;
                       PcB.onHD = true;
                       TSOS.Control.updateHDtable();
                   }
                   else
                       return null;
               }

               PcB.priority = priority;
               this.residentQueue.enqueue(PcB);

               // Send trace message
               _Kernel.krnTrace("Created process with PID " + PcB.PID + ".");

               // Increment nextPID
               this.nextPID++;

               // Return true
               return PcB;
           }

        public createSwapFile(progInput : number[], pid : number): number
        {
            var PCB = new TSOS.PCB();
            var ret = 0;
            var fileName = "~" + pid.toString();

            ret = _HardDrive.createFile(fileName, false);


            if(ret != HDD_SUCCESS)
                return ret;

            ret = _HardDrive.writeToFileData(fileName, progInput, false);

            if(ret != HDD_SUCCESS)
                return ret;


            return HDD_SUCCESS;
        }

        public loadSwapFile(PCB : TSOS.PCB, partition : number): number
        {
            var fileName = "~" + PCB.PID.toString();
            var ret = HDD_SUCCESS;
            var ret2 : any[] = null;
            var data = null;

            ret2 = _HardDrive.readToFileData(fileName, false);

            if(ret2[0] != HDD_SUCCESS)
                return ret2[0];

            data = ret2[1];

            _MemoryManager.loadProgramBytes(data, partition);
            _HardDrive.deleteFile(fileName, false);

            return HDD_SUCCESS;
        }

        public findLastPartition(): any[]
        {
            var part = -1;
            var pcb = null;

            for(var i = this.readyQueue.q.length - 1; (i >= 0) && (part == -1); i--)
            {
                pcb = this.readyQueue.q[i];

                if(pcb.onHD != true)
                {
                   part = _MemoryManager.findPartitionFromBase(pcb.base);
                }
            }
            return [part, pcb];
        }

        public executeProcess(pid : number) : boolean
        {
           if(this.residentQueue.getSize() == 0)
                return false;

            var PCB: TSOS.PCB = this.removeFromResQueue(pid);

            if(PCB == null)
                return false;

            if(_SchedulingMethod == PRIORITY)
                this.priorityQueueAdd(PCB);
            else
                this.readyQueue.enqueue(PCB);

            TSOS.Control.updateReadyQueueTable();


            if(this.processRunning == null)
                this.contextSwitch();

            else {
                if(this.processRunning.priority > PCB.priority)
                {
                    this.contextSwitch();
                }
            }

            // Trace executed process by pid
            _Kernel.krnTrace("Executed process with PID " + PCB.PID + ".");
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

            _Kernel.krnTrace("Executed process with PID " + PCB.PID + ".");    // Trace executed process by pid
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

        public contextSwitch() {
            var newPCB = null;
            var oldPCB = null;
            var part = 0;
            var ret = null;
            var data:number[] = null;
            var tempPCB = null;
            _Kernel.krnTrace("Performing context switch.");

            if (this.processRunning != null) {
                if (this.readyQueue.getSize() > 0) {

                    this.processRunning.xReg = _CPU.Xreg;
                    this.processRunning.yReg = _CPU.Yreg;
                    this.processRunning.accumulator = _CPU.Acc;
                    this.processRunning.PC = _CPU.PC;
                    this.processRunning.zFlag = _CPU.Zflag;
                    this.processRunning.base = _CPU.base;
                    this.processRunning.limit = _CPU.limit;

                    oldPCB = this.processRunning;
                    if (_SchedulingMethod != PRIORITY)

                        this.readyQueue.enqueue(this.processRunning);

                    else {
                        this.priorityQueueAdd(this.processRunning);
                    }
                    newPCB = this.readyQueue.dequeue();


                    if (newPCB.onHD == true) {
                        part = _MemoryManager.nextAvailPartitions();

                        if (part == -1) {
                            ret = this.findLastPartition();
                            data = _MemoryManager.getPartitionBytes(ret[0]);
                            this.createSwapFile(data, ret[1].PID);

                            ret[1].onHD = true;

                            part = ret[0];
                        }
                        else {
                            // _MemoryManager.loadedPartitions[part] = true;
                        }
                        this.loadSwapFile(newPCB, part);
                        newPCB.onHD = false;
                        newPCB.base = _MemoryManager.partitionBaseAddress[part];
                        newPCB.limit = _MemPartitionSize;
                        TSOS.Control.updateHDtable();

                    }
                    this.processRunning = newPCB;


                    _CPU.Xreg = this.processRunning.xReg;
                    _CPU.Yreg = this.processRunning.yReg;
                    _CPU.Acc = this.processRunning.accumulator;
                    _CPU.PC = this.processRunning.PC;
                    _CPU.Zflag = this.processRunning.zFlag;
                    _CPU.base = this.processRunning.base;
                    _CPU.limit = this.processRunning.limit;

                    if (_SchedulingMethod == ROUND_ROBIN  && !_timerOn) {
                        _timerOn = true;
                        _timerCount = 0;
                    }
                    _CPU.isExecuting = true;
                }
            }
            else {

                if (this.readyQueue.getSize() > 0)
                {
                    newPCB = this.readyQueue.dequeue();

                    if (newPCB.onHD == true)
                    {
                        part = _MemoryManager.nextAvailPartitions();

                        if (part == -1) {
                            ret = this.findLastPartition();
                            data = _MemoryManager.getPartitionBytes(ret[0]);
                            this.createSwapFile(data, ret[1].PID);

                            ret[1].onHD = true;

                            part = ret[0];
                        }

                        // _Kernel.krnTrace("CS - partition " + part.toString());

                        this.loadSwapFile(newPCB, part);
                        newPCB.onHD = false;
                        newPCB.base = _MemoryManager.partitionBaseAddress[part];
                        newPCB.limit = _MemPartitionSize;
                        //  _Kernel.krnTrace("CS - base " + newPCB.base);

                        TSOS.Control.updateHDtable();

                    }
                    this.processRunning = newPCB;

                    _CPU.Xreg = this.processRunning.xReg;
                    _CPU.Yreg = this.processRunning.yReg;
                    _CPU.Acc = this.processRunning.accumulator;
                    _CPU.PC = this.processRunning.PC;
                    _CPU.Zflag = this.processRunning.zFlag;
                    _CPU.base = this.processRunning.base;
                    _CPU.limit = this.processRunning.limit;

                    if (_SchedulingMethod == ROUND_ROBIN) {
                        _timerOn = true;
                        _timerCount = 0;
                    }
                        _CPU.isExecuting = true;

                }
                else {

                    if (_timerOn == true) {
                        _timerOn = false;
                        _timerCount = 0;
                    }
                    _CPU.isExecuting = false;

                }
            }
            TSOS.Control.updateRunProcessTable();
            TSOS.Control.updateReadyQueueTable();
        }

        public sortQueuePriority(): void
        {
            var temp : any[] = [];
            var low : number = 0;
            var insert : TSOS.PCB = null;
            var pcb : TSOS.PCB = null;

            while(0 > this.readyQueue.getSize())
            {
                low = -1;

                for(var i = 0; i < this.readyQueue.getSize(); i++)
                {
                    pcb = this.readyQueue.q[i];

                    if(low == -1 || low < pcb.priority)
                    {
                        low = pcb.priority;

                        insert = pcb;
                    }
                }
                temp.push(insert);
                this.removeFromReadyQueue(insert.PID);
            }

            this.readyQueue.q = temp;
        }

        public priorityQueueAdd(pcb : TSOS.PCB)
        {
            var temp : any[] = [];
            var inserted = false;
            for(var i = 0; i < this.readyQueue.getSize(); i++){
                if(!inserted && (pcb.priority < this.readyQueue.q[i].priority)){
                    temp.push(pcb);
                    inserted = true;
                    i = i - 1;
                }
                else
                {
                    temp.push(this.readyQueue.q[i])
                }
            }
            if(!inserted)
                temp.push(pcb);

            this.readyQueue.q = temp;
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