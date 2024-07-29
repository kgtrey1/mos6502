import mos6502 from "./mos6502";
import { type AddressingModes, type AddressingModesMap } from "./addressing";
import { type Instruction, type Instructions, type InstructionsMap } from "./instructions";
import decode from "./decoder";

export {
    type AddressingModes,
    type AddressingModesMap,
    type Instruction,
    type Instructions,
    type InstructionsMap,
    decode,
}

export default mos6502
