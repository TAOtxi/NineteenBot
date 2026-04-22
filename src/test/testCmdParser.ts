import CmdParser from "../utils/CmdParser.js";



const input = 'info -9 aaa --type player --ascend -c 50 --name TAOtxi -d 50'


const parseResult = CmdParser.parseCmd(input);
console.log('Input:', input);
console.log(parseResult);
