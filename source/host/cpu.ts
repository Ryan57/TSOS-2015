///<reference path="../globals.ts" />
///<reference path="memory.ts"/>

/* ------------
     CPU.ts

     Requires global.ts.

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Cpu {

        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public base: number = 0,
                    public limit: number = 0,
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.base = 0;
            this.limit = 0;
            this.isExecuting = false;
        }

        // a9
        public LDA1(value: number)
        {
            this.Acc = value;
            this.PC += 2;
            _Kernel.krnTrace("Executing LDA1.");
        }

        // ad
        public LDA2(address: number)
        {
            this.Acc = _Memory.getMem(address);
            this.PC += 3;
            _Kernel.krnTrace("Executing LDA2.");
        }

        // 8d
        public STA(address: number)
        {
            var value = this.Acc;
            _Memory.setMem(value, address);
            this.PC += 3;
            _Kernel.krnTrace("Executing STA.");

        }

        // 6d
        public ADC(address: number) : boolean
        {
            var value = _Memory.getMem(address);
            this.Acc += value;
            this.PC += 3;
            _Kernel.krnTrace("Executing ADC.");

            if( this.Acc > 255)
                return false;

            return true;
        }

        //a2
        public LDX1(value: number)
        {
            this.Xreg = value;
            this.PC += 2;
            _Kernel.krnTrace("Executing LDX1.");
        }

        //ae
        public LDX2(address: number)
        {
            this.Xreg = _Memory.getMem(address);
            this.PC += 3;
            _Kernel.krnTrace("Executing LDX2.");
        }

        //a0
        public LDY1(value: number)
        {
            this.Yreg = value;
            this.PC += 2;
            _Kernel.krnTrace("Executing LDY1.");
        }

        //ac
        public LDY2(address: number)
        {
            this.Yreg = _Memory.getMem(address);
            this.PC += 3;
            _Kernel.krnTrace("Executing LDY2.");
        }

        //ea
        public NOP()
        {
            //No operation
        }

        //ec
        public CPX(address)
        {
            var value = _Memory.getMem(address);

            if( value == this.Xreg)
                this.Zflag = 0;

            else
                this.Zflag = 1;

            this.PC += 3;
            _Kernel.krnTrace("Executing CPX.");
        }

        //d0
        public BNE(value)
        {
            this.PC += 2;
            _Kernel.krnTrace("Executing BNE.");

            if( this.Zflag == 1 )
            {
                this.PC += value;

                if( this.PC > 255 )
                    this.PC = this.PC - 256;
            }
        }

        //ee
        public INC(address)
        {
            var value = _Memory.getMem(address);
            value += 1;
            _Memory.setMem(value, address);
            this.PC += 3;
            _Kernel.krnTrace("Executing INC.");
        }

        //ff
        public SYS(limit)
        {
            if( this.Xreg == 1 )
            {
                _Kernel.printNumber(this.Yreg);
            }
            if( this.Xreg == 2 )
            {
                var strVal = _MemoryManager.getString(this.Yreg + this.base, limit);
                _Kernel.printText(strVal);
            }
            this.PC += 1;
            _Kernel.krnTrace("Executing SYS.");

        }



        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');

            var instAdd : number =  this.base + this.PC;
            var limit : number = this.base + this.limit;
            var nextValue : number = 0;
            var nib : number = 0;

            if( instAdd >= limit)
            {
                this.abnormalTermination();
                return;
            }

            var inst : string = _Memory.getMem(instAdd).toString(16);

            switch(inst)

            {
                // LDA constant
                case 'a9':
                    if( instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else
                    {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.LDA1(nextValue);
                    }
                    break;

                case 'ad':
                    if( instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else
                    {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if( (this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                             this.LDA2(this.base + nib);
                    }
                    break;

                case '8d':
                    if( instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else
                    {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if( (this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.STA(this.base + nib);
                    }
                    break;

                case '6d':
                    if( instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else
                    {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if( (this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            if( !this.ADC(this.base + nib) )
                                this.overFlow(instAdd);
                    }
                    break;

                case 'a2':
                    if( instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else
                    {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.LDX1(nextValue);
                    }
                    break;

                case 'ae':
                    if( instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.LDX2(this.base + nib);
                    }
                    break;

                case 'a0':
                    if( instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else
                    {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.LDY1(nextValue);
                    }
                    break;

                case 'ac':
                    if( instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.LDY2(this.base + nib);
                    }
                    break;

                case 'ea':
                    break;


                case 'ec':
                    if( instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.CPX(this.base + nib);
                    }
                    break;

                case 'd0':
                    if( instAdd + 1 >= limit)
                        this.abnormalTermination();
                    else
                    {
                        nextValue = _Memory.getMem(instAdd + 1);
                        this.BNE(nextValue);
                    }
                    break;

                case 'ee':
                    if( instAdd + 2 >= limit)
                        this.abnormalTermination();
                    else {
                        nib = this.convertLittleEndian(instAdd + 1);
                        if ((this.base + nib) >= limit)
                            this.memAccessViolation(nib);
                        else
                            this.INC(this.base + nib);
                    }
                    break;

                case 'ff':
                    this.SYS(limit);

                    break;

                case '0':
                    _KernelInterruptQueue.enqueue(new Interrupt(TERMINATE_PROCESS_IRQ,null));
                    this.isExecuting = false;
                    break;

                default:
                    this.invalidOpCode(inst);
                    break;
            }

            TSOS.Control.updateMemTable();
            TSOS.Control.updateCPUTable();
        }

        public memAccessViolation(address: number): void {
            _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ,address));
            this.isExecuting = false;
        }

        public overFlow(address: number): void {
            _KernelInterruptQueue.enqueue(new Interrupt(OVERFLOW_IRQ,address));
            this.isExecuting = false;
        }

        public invalidOpCode(opCode: string): void {
            _KernelInterruptQueue.enqueue(new Interrupt(INVALID_OP_CODE_IRQ,opCode));
            this.isExecuting = false;
        }

        public abnormalTermination(): void {
            _KernelInterruptQueue.enqueue(new Interrupt(UNEXPECTED_TERMINATION_IRQ,null));
            this.isExecuting = false;
        }

        public convertLittleEndian(address: number) : number
        {
            var val2 = _Memory.getMem(address + 1);
            var val1 = _Memory.getMem(address)

            return (val2 * 256) + val1;
        }
    }
}
