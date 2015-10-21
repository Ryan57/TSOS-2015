///<reference path="../globals.ts" />

module TSOS
{
    export class PCB
    {
        constructor(public PID = 0, public PC = 0, public accumulator = 0,
                    public xReg = 0, public yReg = 0, public zFlag = 0,
                    public base = 0, public limit = 0, public timeStamp = new Date())
        {// using constructor as an object to store data
        }

        public toString() : string
        {
            return "PID: " + this.PID.toString() + " PC: " + this.PC.toString() + " Acc: " + this.accumulator.toString() +
                   " Xreg: " + this.xReg.toString() + " Yreg: " + this.yReg.toString() + " Zflag: " + this.zFlag.toString() +
                   " base: " + this.base.toString() + " limit: " + this.limit.toString() + " Time Stamp: " + this.timeStamp.getTime().toString();
        }
    }
}