import { Instructions } from "../instructions"
import { AddressingModes } from "../addressing"

interface DebugInfo {
    address: number
    instruction: Array<number>
    disassembly: {
        instruction: Instructions
        addressingMode: AddressingModes
        operand: number
    }
}

export default DebugInfo
// ABX, no ()
// INX, ()


// IMM: #$1STBIT
// 