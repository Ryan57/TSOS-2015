/**
 * Created by Ryan on 10/6/2015.
 */

module TSOS {

    export class memory {

        constructor(private mem = new Array(256), public length: number = 256) {

            this.clrMem();
        }

        public clrMem(): void {
            for (var i = 0; i < this.length; i++) {
                this.mem[i] = 0;
            }
        }

            public getMem(index : number) : number {
                if(index < 0 || index >= this.length)
                    throw new RangeError("Memory allocation is out of bounds");

                return this.mem[index];
            }

            public setMem(val : number, index : number)
            {
                if(index < 0 || index >= this.length)
                    throw new RangeError("Memory allocation is out of bounds.");

                if(val < 0 || val > this.length)
                    throw new RangeError("Value is out of byte range.");
                        this.mem[index] = val;

        }


    }
}