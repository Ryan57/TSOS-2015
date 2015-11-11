///<reference path="../globals.ts" />
///<reference path="../utils.ts" />
///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />
///<reference path="..\host\control.ts"/>
/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */
// TODO: Write a base class / prototype for system services and let Shell inherit from it.
var TSOS;
(function (TSOS) {
    var Shell = (function () {
        function Shell() {
            // Properties
            this.promptStr = ">";
            this.commandList = [];
            this.curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
            this.apologies = "[sorry]";
        }
        Shell.prototype.init = function () {
            var sc;
            //
            // Load the command list.
            // ver
            sc = new TSOS.ShellCommand(this.shellVer, "ver", "- Displays current version data for this OS.");
            this.commandList[this.commandList.length] = sc;
            // help
            sc = new TSOS.ShellCommand(this.shellHelp, "help", "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;
            // shutdown
            sc = new TSOS.ShellCommand(this.shellShutdown, "shutdown", "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;
            // cls
            sc = new TSOS.ShellCommand(this.shellCls, "cls", "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;
            // man <topic>
            sc = new TSOS.ShellCommand(this.shellMan, "man", "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;
            // trace <on | off>
            sc = new TSOS.ShellCommand(this.shellTrace, "trace", "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;
            // rot13 <string>
            sc = new TSOS.ShellCommand(this.shellRot13, "rot13", "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;
            // prompt <string>
            sc = new TSOS.ShellCommand(this.shellPrompt, "prompt", "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellTest, "test", "<string> - test command");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellDate, "date", "- Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellwhereami, "whereami", "- Displays your current distance from the sun.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellCool, "cool", "- Displays the coolest professor!");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellDarthTrap, "darthtrap", "- Displays an error message!");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellStatChange, "statchange", "- Displays current OS status");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellLoad, "load", "- Ensures valid hex digits and spaces");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellRun, "run", "<number>- Runs a desired process command by <number>.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellLoadAll, "loadall", "- Loads all process commands.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellRunAll, "runall", "- Runs all process commands.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellClrMem, "clearmem", "- Clears all memory partitions.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellKill, "kill", "<number>- Terminates a desired process command by <number>.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellQuantum, "quantum", "- Quantum sets the scheduling process to Round Robin.");
            this.commandList[this.commandList.length] = sc;
            sc = new TSOS.ShellCommand(this.shellPS, "ps", "- Displays each pid for all active processes.");
            this.commandList[this.commandList.length] = sc;
            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            //
            // Display the initial prompt.
            this.putPrompt();
        };
        Shell.prototype.putPrompt = function () {
            _StdOut.putText(this.promptStr);
        };
        Shell.prototype.handleInput = function (buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match.  TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index = 0;
            var found = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                }
                else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            }
            else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + TSOS.Utils.rot13(cmd) + "]") >= 0) {
                    this.execute(this.shellCurse);
                }
                else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {
                    this.execute(this.shellApology);
                }
                else {
                    this.execute(this.shellInvalidCommand);
                }
            }
        };
        // Note: args is an option parameter, ergo the ? which allows TypeScript to understand that.
        Shell.prototype.execute = function (fn, args) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        };
        Shell.prototype.parseInput = function (buffer) {
            var retVal = new TSOS.UserCommand();
            // 1. Remove leading and trailing spaces.
            buffer = TSOS.Utils.trim(buffer);
            // 2. Lower-case it.
            buffer = buffer.toLowerCase();
            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");
            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift(); // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = TSOS.Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;
            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = TSOS.Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        };
        Shell.prototype.outPutMsg = function (msg) {
            if (_Console.buffer.length == 0) {
                // Print msg (this.putText)
                _Console.putText(msg);
                // Advance line
                _Console.advanceLine();
                // Print prompt
                this.putPrompt();
            }
            else {
                // Advance line
                _Console.advanceLine();
                // Print msg (this.putText)
                _Console.putText(msg);
                // Advance line
                _Console.advanceLine();
                // Print prompt
                this.putPrompt();
                // Print this.buffer
                _Console.putText(_Console.buffer);
            }
        };
        //
        // Shell Command Functions.  Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        Shell.prototype.shellInvalidCommand = function () {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            }
            else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        };
        Shell.prototype.shellCurse = function () {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        };
        Shell.prototype.shellApology = function () {
            if (_SarcasticMode) {
                _StdOut.putText("I think we can put our differences behind us.");
                _StdOut.advanceLine();
                _StdOut.putText("For science . . . You monster.");
                _SarcasticMode = false;
            }
            else {
                _StdOut.putText("For what?");
            }
        };
        Shell.prototype.shellVer = function (args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        };
        Shell.prototype.shellHelp = function (args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        };
        Shell.prototype.shellShutdown = function (args) {
            _StdOut.putText("Shutting down...");
            // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        };
        Shell.prototype.shellCls = function (args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        };
        Shell.prototype.shellMan = function (args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of comprehensive valid commands.");
                        break;
                    case "ver":
                        _StdOut.putText("Ver displays the current OS version running.");
                        break;
                    case "whereami":
                        _StdOut.putText("whereami displays the approximate location from the sun.");
                        break;
                    case "cool":
                        _StdOut.putText("cool displays who the coolest professor is!");
                        break;
                    case "darthtrap":
                        _StdOut.putText("Displays an error message!");
                        break;
                    case "statchange":
                        _StdOut.putText("Displays the current OS status.");
                        break;
                    // TODO: Make descriptive MANual page entries for the the rest of the shell commands here.
                    case "date":
                        _StdOut.putText("Displays the current date and time.");
                        break;
                    case "load":
                        _StdOut.putText("Checks for valid Hex digits and loads them into a partition.");
                        break;
                    case "loadAll":
                        _StdOut.putText("Loads all valid Hex digits into available partitions");
                    case "run":
                        _StdOut.putText("Run's a desired process by inputting run pid.");
                        break;
                    case "runAll":
                        _StdOut.putText("Run's all processes for all loaded pid values.");
                        break;
                    case "clearMem":
                        _StdOut.putText("Clears all memory partitions.");
                        break;
                    case "kill":
                        _StdOut.putText("Terminates a desired process by inputting kill pid.");
                        break;
                    case "quantum":
                        _StdOut.putText("Quantum sets the scheduler to Round Robin.");
                        break;
                    case "ps":
                        _StdOut.putText("Displays the pid for each active process.");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            }
            else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        };
        Shell.prototype.shellTrace = function (args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        }
                        else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            }
            else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        };
        Shell.prototype.shellRot13 = function (args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + TSOS.Utils.rot13(args.join(' ')) + "'");
            }
            else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        };
        Shell.prototype.shellPrompt = function (args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            }
            else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        };
        Shell.prototype.shellTest = function (args) {
            _StdOut.putText("here is test text.");
            _StdOut.advanceLine();
            _StdOut.putText("other text");
        };
        Shell.prototype.shellDate = function (args) {
            var date = new Date();
            _StdOut.putText(date.toDateString() + " " + date.toTimeString());
        };
        Shell.prototype.shellwhereami = function (args) {
            _StdOut.putText(" " + "92.96 million miles from the sun");
        };
        Shell.prototype.shellCool = function (args) {
            _StdOut.putText("who's the coolest professor? " + " " + "Alan Laboseur!");
        };
        Shell.prototype.shellDarthTrap = function (args) {
            if (args.length > 0)
                _Kernel.krnTrapError(args.join(' '));
            else
                _StdOut.putText("Usage: darthtrap <message> Please supply and error message.");
        };
        Shell.prototype.shellStatChange = function (args) {
            if (args.length > 0)
                TSOS.Control.hostCurStat(args.join(' '));
            else
                _StdOut.putText("Usage: statchange <status> Please enter a status.");
        };
        Shell.prototype.shellLoad = function (args) {
            var input = document.getElementById("taProgramInput").value;
            if (input.trim().length == 0)
                _StdOut.putText("No program input found");
            else if (input.match("[^a-f|A-F|0-9| ]+"))
                _StdOut.putText("Non hex digits entered");
            else {
                // Trim white space
                var whiteSpaceRegEx = new RegExp("[ ]+");
                var bytes = input.split(whiteSpaceRegEx);
                var rawInput = bytes.join('');
                // Check if over 512 characters (256 bytes)
                if (rawInput.length > 512)
                    // Tell user program input too long
                    _StdOut.putText("Program input over 256 bytes.");
                else {
                    // Standardize input (two charactes , space, two characters ....)
                    var byte;
                    var stdInput = "";
                    for (var i = 0; i < rawInput.length; i += 2) {
                        byte = rawInput[i];
                        if (i + 1 < rawInput.length)
                            byte += rawInput[i + 1];
                        else
                            byte += "0";
                        if (i > 0)
                            stdInput += ' ';
                        stdInput += byte;
                    }
                    // Send the create process interrupt
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CREATE_PROCESS_IRQ, stdInput));
                }
            }
        };
        Shell.prototype.shellLoadAll = function (args) {
            var input = document.getElementById("taProgramInput").value;
            if (input.trim().length == 0)
                _StdOut.putText("No program input found");
            else if (input.match("[^a-f|A-F|0-9| ]+"))
                _StdOut.putText("Non hex digits entered");
            else {
                // Trim white space
                var whiteSpaceRegEx = new RegExp("[ ]+");
                var bytes = input.split(whiteSpaceRegEx);
                var rawInput = bytes.join('');
                // Check if over 512 characters (256 bytes)
                if (rawInput.length > 512)
                    // Tell user program input too long
                    _StdOut.putText("Program input over 256 bytes.");
                else {
                    // Standardize input (two charactes , space, two characters ....)
                    var byte;
                    var stdInput = "";
                    for (var i = 0; i < rawInput.length; i += 2) {
                        byte = rawInput[i];
                        if (i + 1 < rawInput.length)
                            byte += rawInput[i + 1];
                        else
                            byte += "0";
                        if (i > 0)
                            stdInput += ' ';
                        stdInput += byte;
                    }
                    // Send the create process interrupt
                    _Kernel.loadAll(input);
                }
            }
        };
        Shell.prototype.shellRun = function (args) {
            if (args.length == 0)
                _StdOut.putText("Usage - run <pid>");
            else {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(EXECUTE_PROCESS_IRQ, parseInt(args[0])));
            }
        };
        Shell.prototype.shellRunAll = function (args) {
            _Kernel.runAll();
        };
        Shell.prototype.shellClrMem = function (args) {
            _Kernel.clearMem();
        };
        Shell.prototype.shellKill = function (args) {
            if (args.length > 0)
                _Kernel.terminateProcessFromPID(args[0]);
            else
                _StdOut.putText("Usage - kill <int>");
        };
        Shell.prototype.shellQuantum = function (args) {
            if (args.length > 0)
                _Kernel.quantumChange(args[0]);
            else
                _StdOut.putText("Usage - quantum <int>");
        };
        Shell.prototype.shellPS = function (args) {
            _Kernel.displayPS();
        };
        return Shell;
    })();
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
