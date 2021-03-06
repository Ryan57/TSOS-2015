/* ------------
   Globals.ts

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global CONSTANTS (TypeScript 1.5 introduced const. Very cool.)
//
const APP_NAME: string    = "TSOS";   // 'cause Bob and I were at a loss for a better name.
const APP_VERSION: string = "1.07";   // What did you expect?

const CPU_CLOCK_INTERVAL: number = 100;   // This is in ms (milliseconds) so 1000 = 1 second.

const TIMER_IRQ: number = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
                              // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
const KEYBOARD_IRQ: number = 1;

const CREATE_PROCESS_IRQ: number = 2;

const EXECUTE_PROCESS_IRQ: number = 3;

const TERMINATE_PROCESS_IRQ: number = 4;

const MEMORY_ACCESS_VIOLATION_IRQ: number = 5;

const OVERFLOW_IRQ: number = 6;

const INVALID_OP_CODE_IRQ: number = 7;

const UNEXPECTED_TERMINATION_IRQ: number = 8;

const PRINT_TEXT_IRQ: number = 9;

const PRINT_NUMBER_IRQ: number = 10;

const CONTEXT_SWITCH_IRQ: number = 11;

const EXECUTE_ALL_PROCESSES_IRQ: number = 12;

const CREATE_ALL_PROCESSES_IRQ: number = 13;

const QUANTUM_CHANGE_IRQ: number = 14;

const CLEAR_PARTITION_IRQ: number = 15;

const CREATE_FILE_IRQ: number = 16;

const WRITE_FILE_IRQ: number = 17;

const READ_FILE_IRQ: number = 18;

const DELETE_FILE_IRQ: number = 19;

const LIST_FILES_IRQ: number = 20;

const FORMAT_IRQ: number = 21;

const SET_SCHEDULE_IRQ = 22;

const GET_SCHEDULE_IRQ = 23;


//..
// HDriveDeviceDriver Error Codes
//..

const HDD_NOT_FORMATTED: number = 200;

const HDD_FILE_NAME_TO_LONG: number = 201;

const HDD_FILE_DIR_FULL: number = 202;

const HDD_FILE_NAME_DUPLICATE: number = 203;

const HDD_DRIVE_FULL: number = 204;

const HDD_SUCCESS: number = 205;

const HDD_FILE_NOT_FOUND: number = 206;

const HDD_DATA_CORRUPTED: number = 207;


//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
var _Memory: TSOS.memory;
var _MemoryManager: TSOS.MemoryManager;
var _MemMax: number = 768;
var _MemPartitionSize = 256;

var _Scheduler: TSOS.scheduler;

const ROUND_ROBIN = 0;
const FIRST_JOB_FIRST = 1;
const PRIORITY = 2;
var _SchedulingMethod: number = ROUND_ROBIN;


var _HardDrive: TSOS.HDriveDeviceDriver;

var _pcb: TSOS.PCB;

var _timerOn: boolean = false;
var _timerCount: number = 0;
var _quantum: number = 6;

//var _Control: TSOS.Control;

var _CPU: TSOS.Cpu;  // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.

var _OSclock: number = 0;  // Page 23.

var _Mode: number = 0;     // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.

var _Canvas: HTMLCanvasElement;         // Initialized in Control.hostInit().
var _DrawingContext: any; // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
var _DefaultFontFamily: string = "sans";        // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize: number = 13;
var _FontHeightMargin: number = 4;              // Additional space added to font size when advancing a line.

var _Trace: boolean = true;  // Default the OS trace to be on.
var _TraceMode: boolean = false;
var _NextStep: boolean = false;

// The OS Kernel and its queues.
var _Kernel: TSOS.Kernel;
var _KernelInterruptQueue;          // Initializing this to null (which I would normally do) would then require us to specify the 'any' type, as below.
var _KernelInputQueue: any = null;  // Is this better? I don't like uninitialized variables. But I also don't like using the type specifier 'any'
var _KernelBuffers: any[] = null;   // when clearly 'any' is not what we want. There is likely a better way, but what is it?

// Standard input and output
var _StdIn;    // Same "to null or not to null" issue as above.
var _StdOut;

// UI
var _Console: TSOS.Console;
var _OsShell: TSOS.Shell;
var _Control: TSOS.Control;
var _Utils: TSOS.Utils;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode: boolean = false;

// Global Device Driver Objects - page 12
var _krnKeyboardDriver; //  = null;

var _hardwareClockID: number = null;

// For testing (and enrichment)...
var Glados: any = null;  // This is the function Glados() in glados.js on Labouseur.com.
var _GLaDOS: any = null; // If the above is linked in, this is the instantiated instance of Glados.

var onDocumentLoad = function() {
   TSOS.Control.hostInit();
};
