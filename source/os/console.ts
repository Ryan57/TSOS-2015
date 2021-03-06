 ///<reference path="../globals.ts" />

/* ------------
     Console.ts

     Requires globals.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "") {
        }

        public init():void {
            this.clearScreen();
            this.resetXY();
        }

        private clearScreen():void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        private resetXY():void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }

        public handleInput():void {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { //     Enter key
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                // need a case for tab, and up and down arrow keys
                else if (chr == String.fromCharCode(8)) {
                    var bkSpc = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.charAt(this.buffer.length - 1));
                    //creat var bkSpc to take last value in buffer, this finds the most recent character typed which is also the one we want backspaced

                    this.currentXPosition = this.currentXPosition - bkSpc;
                    //subtracts bkSpc from the current position of x on the CLI

                    _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - _DefaultFontSize, bkSpc,
                                              _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + 2);
                    //clears the space of the last character in the buffer, accounting for any extra space taken below the rect by a: j or g

                    this.buffer = this.buffer.substr(0, this.buffer.length - 1);
                    //finds last character in buffer
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Write a case for Ctrl-C.
            }
        }

        public putText(text):void {
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            //
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            //         Consider fixing that.
            if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }
        }

        public advanceLine():void {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            this.currentYPosition += _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;

            if (this.currentYPosition > _Canvas.height) {

                var yPos = _DefaultFontSize +
                    _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                    _FontHeightMargin;

                // TODO: Handle scrolling. (iProject 1)

                var dwnScroll = _DrawingContext.getImageData(0, yPos, _Canvas.width, this.currentYPosition);
                // created dwnScroll variable, which stores the Image data from the canvas when the y position exceeds _Canvas.height

                this.currentYPosition -= yPos;

                _DrawingContext.getImageData(0, yPos, _Canvas.width, this.currentYPosition);


                this.clearScreen();
                //clears screen to redraw the canvas at an appropriate height for user to continue typing and viewing results

                _DrawingContext.putImageData(dwnScroll, 0, 0);
                //Pastes or redraws the canvas image in a "scrolled up" fassion, allowing users to see beyond scope of canvas length
            }
        }

        public darthScreen(darthErrMsg : string) : void {


            _DrawingContext.fillStyle = "blue";                                  //Sets the color of the canvas to blue

            _DrawingContext.fillRect(0, 0, _Canvas.width, _Canvas.height);      //Fills the canvas with this color change

            var darthErrMsg = "Error, you have exceeded the boundaries of the system. Reset the OS, or refresh the page.";

            _DrawingContext.font = this.currentFont;
            _DrawingContext.fillStyle = "white";
            _DrawingContext.fillText(darthErrMsg, 10, 10);

        }


    }
}
