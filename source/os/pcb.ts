
module TSOS
{
    export class PCB
    {
    constructor(public PID = 0, public PC = 0, public accumulator = 0,
                public xReg = 0, public yReg = 0, public zFlag = 0,
                public base = 0, public limit = 0, public timeStamp = new Date())
    {// using constructor as an object to store data
    }

    }
}