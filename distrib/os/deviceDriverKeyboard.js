///<reference path="../globals.ts" />
///<reference path="deviceDriver.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */
var TSOS;
(function (TSOS) {
    var chrCodes = [];
    var shiftedChrCode = [];
    // Extends DeviceDriver
    var DeviceDriverKeyboard = (function (_super) {
        __extends(DeviceDriverKeyboard, _super);
        function DeviceDriverKeyboard() {
            // Override the base method pointers.
            _super.call(this, this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
        }
        DeviceDriverKeyboard.prototype.krnKbdDriverEntry = function () {
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
            chrCodes[48] = "0";
            shiftedChrCode[48] = ")";
            chrCodes[49] = "1";
            shiftedChrCode[49] = "!";
            chrCodes[50] = "2";
            shiftedChrCode[50] = "@";
            chrCodes[51] = "3";
            shiftedChrCode[51] = "#";
            chrCodes[52] = "4";
            shiftedChrCode[52] = "$";
            chrCodes[53] = "5";
            shiftedChrCode[53] = "%";
            chrCodes[54] = "6";
            shiftedChrCode[54] = "^";
            chrCodes[55] = "7";
            shiftedChrCode[55] = "&";
            chrCodes[56] = "8";
            shiftedChrCode[56] = "*";
            chrCodes[57] = "9";
            shiftedChrCode[57] = "(";
            //check all keycodes in browser OS
        };
        DeviceDriverKeyboard.prototype.krnKbdDispatchKeyPress = function (params) {
            // Parse the params.    TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||
                ((keyCode >= 97) && (keyCode <= 123))) {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);
                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            }
            else if ((keyCode == 32) ||
                (keyCode == 13) ||
                (keyCode == 8) ||
                (keyCode == 9)) {
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            }
            else if (((keyCode >= 48) && (keyCode <= 57)) ||
                (keyCode == 192) || (keyCode == 173) || (keyCode == 61) ||
                (keyCode == 219) || (keyCode == 221) || (keyCode == 220) ||
                (keyCode == 59) || (keyCode == 222) || (keyCode == 188) ||
                (keyCode == 190) || (keyCode == 191)) {
                if (isShifted == true)
                    chr = shiftedChrCode[keyCode];
                else
                    chr = chrCodes[keyCode];
                _KernelInputQueue.enqueue(chr);
            }
        };
        return DeviceDriverKeyboard;
    })(TSOS.DeviceDriver);
    TSOS.DeviceDriverKeyboard = DeviceDriverKeyboard;
})(TSOS || (TSOS = {}));
