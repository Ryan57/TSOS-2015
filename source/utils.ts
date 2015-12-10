/* --------
   Utils.ts

   Utility functions.
   -------- */

module TSOS {

    export class Utils {

        public static asciiChars = {
            32:  ' ',
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
            65:  'A',
            66:  'B',
            67:  'C',
            68: 'D',
            69: 'E',
            70: 'F',
            71: 'G',
            72: 'H',
            73: 'I',
            74: 'J',
            75: 'K',
            76: 'L',
            77: 'M',
            78: 'N',
            79: 'O',
            80: 'P',
            81: 'Q',
            82: 'R',
            83: 'S',
            84: 'T',
            85: 'U',
            86: 'V',
            87: 'W',
            88: 'X',
            89: 'Y',
            90: 'Z',
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
            122: 'z',
            126: '~'};

        public static asciiVals = {
            ' ':  32,
            '0': 48,
            '1': 49,
            '2': 50,
            '3': 51,
            '4': 52,
            '5': 53,
            '6': 54,
            '7': 55,
            '8': 56,
            '9': 57,
            'A': 65,
            'B': 66,
           'C': 67,
            'D': 68,
            'E': 69,
            'F': 70,
            'G': 71,
            'H': 72,
           'I': 73,
            'J': 74,
            'K': 75,
            'L': 76,
            'M': 77,
            'N': 78,
            'O': 79,
            'P': 80,
            'Q': 81,
            'R': 82,
            'S': 83,
            'T': 84,
            'U': 85,
           'V': 86,
           'W': 87,
            'X': 88,
           'Y': 89,
            'Z': 90,
           'a': 97,
            'b': 98,
            'c': 99,
            'd': 100,
           'e': 101,
           'f': 102,
            'g': 103,
           'h': 104,
           'i': 105,
           'j': 106,
            'k': 107,
            'l': 108,
            'm': 109,
            'n': 110,
            'o': 111,
            'p': 112,
            'q': 113,
            'r': 114,
            's': 115,
            't': 116,
            'u': 117,
            'v': 118,
            'w': 119,
            'x': 120,
            'y': 121,
            'z': 122,
            '~': 126
    };

        public static getAsciiChar(val : number) : string
        {
            var char = this.asciiChars[val];
            if(char == undefined)
            {
                char = "_";
            }
            return char;
        }

        public static getAsciiVal(val : string) : number
        {
            var vals = this.asciiVals[val];
            if(vals == undefined)
            {
                vals = 0;
            }
            return vals;
        }

        public static trim(str): string {
            // Use a regular expression to remove leading and trailing spaces.
            return str.replace(/^\s+ | \s+$/g, "");
            /*
            Huh? WTF? Okay... take a breath. Here we go:
            - The "|" separates this into two expressions, as in A or B.
            - "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
            - "\s+$" is the same thing, but at the end of the string.
            - "g" makes is global, so we get all the whitespace.
            - "" is nothing, which is what we replace the whitespace with.
            */
        }

        public static rot13(str: string): string {
            /*
               This is an easy-to understand implementation of the famous and common Rot13 obfuscator.
               You can do this in three lines with a complex regular expression, but I'd have
               trouble explaining it in the future.  There's a lot to be said for obvious code.
            */
            var retVal: string = "";
            for (var i in <any>str) {    // We need to cast the string to any for use in the for...in construct.
                var ch: string = str[i];
                var code: number = 0;
                if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0) {
                    code = str.charCodeAt(i) + 13;  // It's okay to use 13.  It's not a magic number, it's called rot13.
                    retVal = retVal + String.fromCharCode(code);
                } else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0) {
                    code = str.charCodeAt(i) - 13;  // It's okay to use 13.  See above.
                    retVal = retVal + String.fromCharCode(code);
                } else {
                    retVal = retVal + ch;
                }
            }
            return retVal;
        }

        public static padWithZeros(str:string,num:number) : string
        {
            var newstr : string = str;

            while( newstr.length < num)
                newstr = '0' + newstr;

            return newstr;
        }

        public static formatTimeString(date:Date) : string
        {
            var hour = date.getHours();
            var minute = date.getMinutes();
            var seconds = date.getSeconds();

            if(hour > 12)
            {
                hour = hour - 12;
            }
            return hour.toString() + ":" + minute.toString() + ":" + seconds.toString();

        }
    }
}
