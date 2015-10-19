///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />

/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {

        var chrCodes : string[] = [];
        var shiftedChrCode : string[] = [];

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {
        constructor() {
            // Override the base method pointers.
            super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
        }



        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
            shiftedChrCode[192] = "~";
            chrCodes[192] = "`";
            shiftedChrCode[173] = "_";
            chrCodes[173] = "-";
            shiftedChrCode[61] = "+";
            chrCodes[61] = "=";
            shiftedChrCode[219] = "{";
            chrCodes[219] = "[";
            shiftedChrCode[221] = "}";
            chrCodes[221] = "]";
            shiftedChrCode[220] = "|";
            chrCodes[220] = "'\'";
            shiftedChrCode[59] = ":";
            chrCodes[59] = ";";
            shiftedChrCode[222] = '"';
            chrCodes[222] = "'";
            shiftedChrCode[188] = "<";
            chrCodes[188] = ",";
            shiftedChrCode[190] = ">";
            chrCodes[190] = ".";
            shiftedChrCode[191] = "?";
            chrCodes[191] = "/";
            shiftedChrCode[48] = ")";
            shiftedChrCode[49] = "!";
            shiftedChrCode[50] = "@";
            shiftedChrCode[51] = "#";
            shiftedChrCode[52] = "$";
            shiftedChrCode[53] = "%";
            shiftedChrCode[54] = "^";
            shiftedChrCode[55] = "&";
            shiftedChrCode[56] = "*";
            shiftedChrCode[57] = "(";

            //check all keycodes in browser OS
        }

        public krnKbdDispatchKeyPress(params) {
            // Parse the params.    TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||   // A..Z
                ((keyCode >= 97) && (keyCode <= 123))) {  // a..z {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);
                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);

            } else if ((keyCode == 32)                     ||   // space
                       (keyCode == 13)                     ||   // enter
                       (keyCode == 8 )                     ||   // backspace
                       (keyCode == 9))                          // tab
            {
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);

            }
            else if (((keyCode >= 48) && (keyCode <= 57))   ||  //digits
                      (keyCode == 192) || (keyCode == 173)  || (keyCode == 61)  ||
                      (keyCode == 219) || (keyCode == 221)  || (keyCode == 220) ||
                      (keyCode == 59)  || (keyCode == 222)  || (keyCode == 188) ||
                      (keyCode == 190) || (keyCode == 191))
            {
                if(isShifted == true)
                    chr = shiftedChrCode[keyCode];
                else
                    chr = chrCodes[keyCode];
                _KernelInputQueue.enqueue(chr);
            }

        }

    }
}

