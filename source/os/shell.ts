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

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor() {
        }

        public init() {
            var sc;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                "ver",
                "- Displays current version data for this OS.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                "help",
                "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                "shutdown",
                "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                "cls",
                "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                "man",
                "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                "trace",
                "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                 "rot13",
                 "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                 "prompt",
                "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellTest,
                "test",
                "<string> - test command");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellDate,
                 "date",
                "- Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellwhereami,
                "whereami",
                "- Displays your current distance from the sun.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellCool,
                "cool",
                "- Displays the coolest professor!");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellDarthTrap,
                "darthtrap",
                "- Displays an error message!");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellStatChange,
                "statchange",
                "- Displays current OS status");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellLoad,
                "load",
                "<number>- Ensures valid hex digits and spaces from program input, & sets priority by <number>.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRun,
                "run",
                "<number>- Runs a desired process command by <number>.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellLoadAll,
                "loadall",
                "- Loads all process commands.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRunAll,
                "runall",
                "- Runs all process commands.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellClrMem,
                "clearmem",
                "- Clears all memory partitions.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellKill,
                "kill",
                "<number>- Terminates a desired process command by <number>.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellQuantum,
                "quantum",
                "- Quantum sets the scheduling process to Round Robin.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellPS,
                "ps",
                "- Displays each pid for all active processes.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellCreate,
                "create",
                "<string>- Creates a file.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellWrite,
                "write",
                "- Writes to an existing file.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRead,
                "read",
                "- Reads data from an existing file.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellDelete,
                "delete",
                "- Deletes an existing file.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellList,
                "ls",
                "- Lists all existing files.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellFormat,
                "format",
                "- Formats HardDrive.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellSetSchedule,
                "setSchedule",
                "<int>- Sets the scheduling method.");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellGetSchedule,
                "getSchedule",
                "- Gets the current scheduling method being used.");
            this.commandList[this.commandList.length] = sc;


            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            //
            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
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
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // Note: args is an option parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
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
        }

        public parseInput(buffer): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        public outPutMsg(msg : string) : void
        {
            if( _Console.buffer.length == 0 )
            {
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
        }

        //
        // Shell Command Functions.  Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        public shellVer(args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);

        }

        public shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        }

        public shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }

        public shellMan(args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of comprehensive valid commands.");
                        break;
                    case "ver":
                        _StdOut.putText("Ver displays the current OS version running.");
                        break;
                    case "cls":
                        _StdOut.putText("Clears the screen.");
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
                    case "create":
                        _StdOut.putText("Creates a file, by inputting 'create name'.");
                        break;
                    case "write":
                        _StdOut.putText("Writes to an existing file.");
                        break;
                    case "read":
                        _StdOut.putText("Reads data from an existing file.");
                        break;
                    case "delete":
                        _StdOut.putText("Deletes an existing file.");
                        break;
                    case "ls":
                        _StdOut.putText("Displays all existing files.");
                        break;
                    case "setschedule":
                        _StdOut.putText("setSchedule sets the scheduler by inputting setSchedule type.");
                        break;
                    case "getschedule":
                        _StdOut.putText("getSchedule displays the current scheduling method in use.");
                        break;
                    case "format":
                        _StdOut.putText("Formats the HardDrive.");
                        break;

                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }

        public shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
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
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }

        public shellTest(args) {
            _StdOut.putText("here is test text.");
            _StdOut.advanceLine();
            _StdOut.putText("other text");

        }


        public shellDate(args) {
            var date : Date = new Date();

            _StdOut.putText(date.toDateString() + " " + date.toTimeString());
        }

        public shellwhereami(args) {
            _StdOut.putText(" " + "92.96 million miles from the sun");
        }

        public shellCool(args) {
            _StdOut.putText("who's the coolest professor? " + " " + "Alan Laboseur!");
        }

        public shellDarthTrap(args) {
            if( args.length > 0)
                _Kernel.krnTrapError(args.join(' '));
            else
                _StdOut.putText("Usage: darthtrap <message> Please supply and error message.")

        }
        public shellStatChange(args) {
            if( args.length > 0)
                Control.hostCurStat(args.join(' '));
            else
                _StdOut.putText("Usage: statchange <status> Please enter a status.")

        }

        public shellLoad(args) {
            var input : string = (<HTMLInputElement>document.getElementById("taProgramInput")).value;

            if(args.length == 0)
                _pcb.priority = 10;
            else
                _pcb.priority = args;

            if( input.trim().length == 0)
                _StdOut.putText("No program input found");
            else if( input.match("[^a-f|A-F|0-9| ]+"))
                _StdOut.putText("Non hex digits entered");
            else
            {
                // Trim white space
                var whiteSpaceRegEx : RegExp = new RegExp("[ ]+");
                var bytes : string[] = input.split(whiteSpaceRegEx);
                var rawInput : string = bytes.join('');

                // Check if over 512 characters (256 bytes)
                if( rawInput.length > 512)

                    // Tell user program input too long
                    _StdOut.putText("Program input over 256 bytes.");

                // Else
                else
                {

                    // Standardize input (two charactes , space, two characters ....)
                    var byte : string;
                    var stdInput : string = "";
                    for( var i = 0; i < rawInput.length; i += 2)
                    {
                        byte = rawInput[i];
                        if( i + 1 < rawInput.length)
                            byte += rawInput[i + 1];
                        else
                            byte += "0";

                        if( i > 0)
                            stdInput += ' ';
                        stdInput += byte;
                    }

                    // Send the create process interrupt
                    _KernelInterruptQueue.enqueue(new Interrupt(CREATE_PROCESS_IRQ,stdInput));
                }
            }
        }

        public shellLoadAll(args) {
            var input:string = (<HTMLInputElement>document.getElementById("taProgramInput")).value;

            if(args.length == 0)
                _pcb.priority = 10;

            if (input.trim().length == 0)
                _StdOut.putText("No program input found");
            else if (input.match("[^a-f|A-F|0-9| ]+"))
                _StdOut.putText("Non hex digits entered");
            else {
                // Trim white space
                var whiteSpaceRegEx:RegExp = new RegExp("[ ]+");
                var bytes:string[] = input.split(whiteSpaceRegEx);
                var rawInput:string = bytes.join('');

                // Check if over 512 characters (256 bytes)
                if (rawInput.length > 512)

                // Tell user program input too long
                    _StdOut.putText("Program input over 256 bytes.");

                // Else
                else {

                    // Standardize input (two charactes , space, two characters ....)
                    var byte:string;
                    var stdInput:string = "";
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
        }


        public shellRun(args)
        {
            if(args.length == 0)
            _StdOut.putText("Usage - run <pid>");

            else
            {
                _KernelInterruptQueue.enqueue(new Interrupt(EXECUTE_PROCESS_IRQ, parseInt(args[0])));

            }
        }

        public shellRunAll(args)
        {
            _Kernel.runAll();
        }

        public shellClrMem(args)
        {
            _Kernel.clearMem();
        }

        public shellKill(args)
        {
            if(args.length > 0)
                _Kernel.terminateProcessFromPID(args[0]);

            else
                _StdOut.putText("Usage - kill <int>");
        }

        public shellQuantum(args)
        {
            if(args.length > 0)
                _Kernel.quantumChange(args[0]);

            else
                _StdOut.putText("Usage - quantum <int>");
        }

        public shellPS(args)
        {
            _Kernel.displayPS();
        }

        public shellCreate(args)
        {
            if(args.length > 0)
                _Kernel.createFile(args[0]);

            else
                _StdOut.putText("Usage - create <string>");
        }

        public shellWrite(args)
        {
            var text;
            var fileName;

            if(args.length > 1)
            {
                fileName = args[0];
                args.splice(0, 1);
                text = args.join(' ');
                _Kernel.writeToFile(fileName, text);
            }

            else
                _StdOut.putText("Usage - write <string> <string>");
        }

        public shellRead(args)
        {
            if(args.length > 0)
                _Kernel.readFile(args[0]);

            else
                _StdOut.putText("Usage - read <string>");
        }

        public shellDelete(args)
        {
            if(args.length > 0)
                _Kernel.deleteFile(args[0]);

            else
                _StdOut.putText("Usage - delete <string>");
        }

        public shellList(args)
        {
                _Kernel.listFiles();
        }

        public shellFormat(args)
        {
            _Kernel.formatDrive();
        }

        public shellSetSchedule(args)
        {
            var type : number;
            var rr;
            var pr;
            var fjf;

            if(args == null) {
                _StdOut.putText("Scheduler methods: (rr = round robin, pr = priority, & fjf = first job first")
                _StdOut.putText("Usage - setSchedule <string>")
            }
            else if(args == pr) {
                type = 2;
                //_SchedulingMethod = 2;
                _KernelInterruptQueue.enqueue(new Interrupt(SET_SCHEDULE_IRQ, type));
                _StdOut.putText("Scheduler set to Priority.");

            }
            else if(args == fjf) {
                type = 1;
               // _SchedulingMethod = 1;
                _KernelInterruptQueue.enqueue(new Interrupt(SET_SCHEDULE_IRQ, type));
                _StdOut.putText("Scheduler set to First Job First.");

            }
            else{
                type = 0;
               // _SchedulingMethod = 0;
                _KernelInterruptQueue.enqueue(new Interrupt(SET_SCHEDULE_IRQ, type));
                _StdOut.putText("Scheduler set to Round Robin.");
            }
        }

        public shellGetSchedule(args)
        {
            _Kernel.getSchedule();
        }

    }
}
