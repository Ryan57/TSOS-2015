///<reference path="../globals.ts" />
///<reference path="pcb.ts" />
///<reference path="../host/control.ts" />

module TSOS {

    export class MemoryManager
    {
        public ascii = {32:  ' ',
                        48:  '0',
                        49:  '1',
                        50:  '2',
                        51:  '3',
                        52:  '4',
                        53:  '5',
                        54:  '6',
                        55:  '7',
                        56:  '8',
                        57:  '9',
                        97:  'a',
                        98:  'b',
                        99:  'c',
                        100: 'd',
                        101: 'e',
                        102: 'f',
                        103: 'g',
                        104: 'h',
                        105: 'i',
                        106: 'j',
                        107: 'k',
                        108: 'l',
                        109: 'm',
                        110: 'n',
                        111: 'o',
                        112: 'p',
                        113: 'q',
                        114: 'r',
                        115: 's',
                        116: 't',
                        117: 'u',
                        118: 'v',
                        119: 'w',
                        120: 'x',
                        121: 'y',
                        122: 'z'};



        constructor(public loadedPartitions: Array<boolean> = new Array<boolean>(),
                    public partitionBaseAddress: Array<number> = new Array<number>())
        {
            var baseAddress = 0;

            this.loadedPartitions[0] = false;
            this.loadedPartitions[1] = false;
            this.loadedPartitions[2] = false;

            for(var i = 0; i < 3; i++)
            {
                this.partitionBaseAddress[i] = baseAddress;
                baseAddress += 256;
            }
        }

    public availablePartitions(): number
    {
        var availPartitions = 0;

        for(var i = 0; i < 3; i++)
        {
         if(this.loadedPartitions[i] == false)
             availPartitions++;
        }

        return availPartitions;
    }

     public loadProgram(prog : string, pid : number) : TSOS.PCB {

         var found = false;
         var partition = 0;

         for(var i = 0; (i < this.loadedPartitions.length) && !found; i++)
         {
             if(this.loadedPartitions[i] == false)
             {
                 partition = i;
                 found = true;
             }
         }
         _Kernel.krnTrace("partition " + partition.toString());

            if(!found)
                return null;

        // if (this.loadedPCB != null)
          //   return null;

         var bytes = prog.split(' ');
         var value:number = 0;

        this.clrPartition(partition);

         var base = this.partitionBaseAddress[partition];
         var limit = base + _MemPartitionSize;

         var byteIndex = 0;
         _Kernel.krnTrace("len" + bytes.length.toString());

         for (var i = base; (byteIndex < bytes.length) && (i < limit ); i++) {
             value = parseInt(bytes[byteIndex], 16);
             _Memory.setMem(value, i);
             byteIndex++;

             _Kernel.krnTrace("index, value " + i.toString() + "," + value.toString(16));

         }


         var PcB:TSOS.PCB = new TSOS.PCB(pid);
         PcB.base = this.partitionBaseAddress[partition];
         PcB.limit = _MemPartitionSize;
         this.loadedPartitions[partition] = true;


         TSOS.Control.updateMemTable();

         return PcB;
     }

     public clrPartition(iPartition: number)
        {
            if(iPartition < 0 || iPartition > 2)
                return;

            var base = this.partitionBaseAddress[iPartition];
            var limit = base + _MemPartitionSize;

            for (var i = base; i < limit; i++) {
                _Memory.setMem(0, i);
                _Kernel.krnTrace("CLR index " + i.toString());
            }
            this.loadedPartitions[iPartition] = false;
        }

        public clrAllPartitions()
        {
            for(var i = 0; i < 3; i++)
            {
                this.clrPartition(i);
            }
            TSOS.Control.updateMemTable();
        }

     public unmarkPartition(baseAddr: number)
        {
            var partition = -1;

            for(var i = 0; (i < this.partitionBaseAddress.length) && (partition == -1); i++)
            {
                if(this.partitionBaseAddress[i] == baseAddr)
                    partition = i;
            }
                if(partition == -1)
                return;

            this.loadedPartitions[partition] = false;
        }

     public getString(address : number,limit : number) : string
        {
            var str : string = "";
            var val : number = 0;
            var end : boolean = false;

            while( (address < limit) && !end )
            {
                val = _Memory.getMem(address);
                if( val == 0)
                    end = true;
                else
                {
                    if ((val >= 97 && val <= 122) || (val >= 48 && val <= 57) || val == 32)
                        str += this.ascii[val];
                    address++;
                }
            }

            return str;
        }
    }

}