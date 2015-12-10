///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />


module TSOS {

    export class FileBlock {

        constructor(public location : string = "0.0.0", public track : number = 0, public sector : number = 0, public block : number = 0, public inUse : boolean = false, public data : string[] = [])
        {

        }

        public loadBlock(track : number, sector :number, block : number) : void
        {
            this.location = track.toString() + '.' + sector.toString() + '.' + block.toString();
            var data = sessionStorage.getItem(this.location);

            this.data = data.split('.');


            if(this.getByte(0) == 1)
                this.inUse = true;
            else
                this.inUse = false;

            this.track = this.getByte(1);
            this.sector = this.getByte(2);
            this.block = this.getByte(3);

        }

        public setByte(index : number, value : number) : boolean
        {
            var ret = false;
            var hexVal : string;

            if(index < this.data.length) {
                if(value == -1)
                    hexVal = "-1";
                else
                {
                    hexVal = value.toString(16);

                    if (hexVal.length == 1)
                        hexVal = '0' + hexVal;
                }



                this.data[index] = hexVal;

                ret = true;
            }

            return ret;
        }

        public getLocation(): any[]
        {
            var num = this.location[0];
            var retVal = [];
            retVal.push(num.toString());
            num = this.location[2];
            retVal.push(num.toString());
            num = this.location[4];
            retVal.push(num.toString());

            return retVal;
        }

        public getByte(index : number) : number
        {
            var byte = -1;
            var hexVal;
            var val;

            if(index < this.data.length)
            {
                hexVal = this.data[index];
                if(hexVal == "-1")
                    val = -1;

                else
                    val = parseInt(hexVal, 16);

                byte = val;
            }

            return byte;
        }

        public setInUse(inUse : boolean) : void
        {
            var val = 0;

            if(inUse == true)
                val = 1;

            this.setByte(0, val);
        }

        public setTSB(track : number, sector : number, block : number) : void
        {
            this.setByte(1, track);
            this.setByte(2, sector);
            this.setByte(3, block);

        }

        public setText(text : string, append : boolean = true) : number
        {
            var index = -1;
            var readIndex = 0;
            var value = 0;
            if(append == true) {
                for (var i = 4; (i < (this.data.length)) && index == -1; i++) {
                    if (this.getByte(i) == -1)
                        index = i;
                }
            }
            else
                index = 4;

            for(var i = index; i < (this.data.length); i++)
            {
                if(readIndex < text.length)
                {
                    value = TSOS.Utils.getAsciiVal(text[readIndex]);
                    this.setByte(i, value);
                    readIndex++;
                }
                else
                    this.setByte(i, -1);
            }

            return readIndex;
        }

        public setData(data : number[], append : boolean = true) : number
        {
            var index = -1;
            var readIndex = 0;
            var value = 0;
            if(append == true) {
                for (var i = 4; (i < (this.data.length)) && index == -1; i++) {
                    if (this.getByte(i) == -1)
                        index = i;
                }
            }
            else
                index = 4;

            for(var i = index; i < (this.data.length); i++)
            {
                if(readIndex < data.length)
                {
                    this.setByte(i, data[readIndex]);
                    readIndex++;
                }
                else
                    this.setByte(i, -1);
            }

            return readIndex;
        }

        public getText() : string
        {
            var end = false;
            var str = "";
            for(var i = 4; (i < (this.data.length)) && !end; i++)
            {
                if(this.getByte(i) == -1)
                    end = true;
                else
                    str += TSOS.Utils.getAsciiChar(this.getByte(i));
            }
            return str;
        }

        public getData() :  number[]
        {
            var end = false;
            var data : number[] = [];
            for(var i = 4; (i < (this.data.length)) && !end; i++)
            {
                if(this.getByte(i) == -1)
                    end = true;
                else
                    data.push(this.getByte(i));
            }
            return data;
        }

        public saveBlock() : void
        {
            sessionStorage.setItem(this.location, this.data.join('.'));
        }

        public createKey() : string
        {
            return this.track.toString() + '.' + this.sector.toString() + '.' + this.block.toString();
        }

        public getNextBlock(): TSOS.FileBlock
        {
            if(this.track == -1 || this.sector == -1 || this.block == -1)
                return null;

            var nextBlock = new TSOS.FileBlock();
            nextBlock.loadBlock(this.track, this.sector, this.block);

            return nextBlock;
        }

        public getLastBlock(): TSOS.FileBlock
        {
            var nextBlock = this.getNextBlock();
            var currBlock = nextBlock;

            while(nextBlock != null)
            {
                currBlock = nextBlock;
                nextBlock = nextBlock.getNextBlock();
            }

            return currBlock;

        }

        public clearData(): void
        {
            for(var i = 4; i < (this.data.length); i++)
            {
                this.setByte(i, -1);
            }
        }
    }
}
