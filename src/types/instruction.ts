interface Instruction {
    name: string
    op: () => void
    mode: () => void
    cycles: number
}

export default Instruction

export type Instructions =
    'ADC' | 'AND' | 'ASL' | 'BCC' | 'BCS' | 'BEQ' | 'BIT' | 'BMI' | 'BNE' | 'BPL' | 'BRK' | 'BVC' |
    'BVS' | 'CLC' | 'CLD' | 'CLI' | 'CLV' | 'CMP' | 'CPX' | 'CPY' | 'DEC' | 'DEX' | 'DEY' | 'EOR' |
    'INC' | 'INX' | 'INY' | 'JMP' | 'JSR' | 'LDA' | 'LDX' | 'LDY' | 'LSR' | 'NOP' | 'ORA' | 'PHA' |
    'PHP' | 'PLA' | 'PLP' | 'ROL' | 'ROR' | 'RTI' | 'RTS' | 'SBC' | 'SEC' | 'SED' | 'SEI' | 'STA' |
    'STX' | 'STY' | 'TAX' | 'TAY' | 'TSX' | 'TXA' | 'TXS' | 'TYA' | '???'

export type AddressingModes =
    'IMP' | 'IMM' | 'ABS' | 'ABX' | 'ABY' | 'IND' | 'INX' | 'INY' | 'REL' | 'ZPI' | 'ZPX' | 'ZPY'

export interface Test {
    instruction: Instructions
    addressing: AddressingModes
    cycles: number
}

export type AddressingModesMap = { [code in AddressingModes ] : () => number }
export type InstructionsMap = { [code in Instructions ] : () => number }

const matrix: ReadonlyMap<number, Test> = new Map<number, Test>([
    [0x00, { instruction: 'BRK', addressing: 'IMP', cycles: 7 }],
    [0x01, { instruction: 'ORA', addressing: 'INX', cycles: 6 }],
    [0x05, { instruction: 'ORA', addressing: 'ZPI', cycles: 3 }],
    [0x06, { instruction: 'ASL', addressing: 'ZPI', cycles: 5 }],
    [0x08, { instruction: 'PHP', addressing: 'IMP', cycles: 3 }],
    [0x09, { instruction: 'ORA', addressing: 'IMM', cycles: 2 }],
    [0x0A, { instruction: 'ASL', addressing: 'IMP', cycles: 2 }],
    [0x0D, { instruction: 'ORA', addressing: 'ABS', cycles: 4 }],
    [0x0E, { instruction: 'ASL', addressing: 'ABS', cycles: 6 }],
    [0x10, { instruction: 'BPL', addressing: 'REL', cycles: 2 }],
    [0x11, { instruction: 'ORA', addressing: 'INY', cycles: 5 }],
    [0x15, { instruction: 'ORA', addressing: 'ZPX', cycles: 4 }],
    [0x16, { instruction: 'ASL', addressing: 'ZPX', cycles: 6 }],
    [0x18, { instruction: 'CLC', addressing: 'IMP', cycles: 2 }],
    [0x19, { instruction: 'ORA', addressing: 'ABY', cycles: 4 }],
    [0x1D, { instruction: 'ORA', addressing: 'ABX', cycles: 4 }],
    [0x1E, { instruction: 'ASL', addressing: 'ABX', cycles: 7 }],
    [0x20, { instruction: 'JSR', addressing: 'ABS', cycles: 6 }],
    [0x21, { instruction: 'AND', addressing: 'INX', cycles: 6 }],
    [0x24, { instruction: 'BIT', addressing: 'ZPI', cycles: 3 }],
    [0x25, { instruction: 'AND', addressing: 'ZPI', cycles: 3 }],
    [0x26, { instruction: 'ROL', addressing: 'ZPI', cycles: 5 }],
    [0x28, { instruction: 'PLP', addressing: 'IMP', cycles: 4 }],
    [0x29, { instruction: 'AND', addressing: 'IMM', cycles: 2 }],
    [0x2A, { instruction: 'ROL', addressing: 'IMP', cycles: 2 }],
    [0x2C, { instruction: 'BIT', addressing: 'ABS', cycles: 4 }],
    [0x2D, { instruction: 'AND', addressing: 'ABS', cycles: 4 }],
    [0x2E, { instruction: 'ROL', addressing: 'ABS', cycles: 6 }],
    [0x30, { instruction: 'BMI', addressing: 'REL', cycles: 2 }],
    [0x31, { instruction: 'AND', addressing: 'INY', cycles: 5 }],
    [0x35, { instruction: 'AND', addressing: 'ZPX', cycles: 4 }],
    [0x36, { instruction: 'ROL', addressing: 'ZPX', cycles: 6 }],
    [0x38, { instruction: 'SEC', addressing: 'IMP', cycles: 2 }],
    [0x39, { instruction: 'AND', addressing: 'ABY', cycles: 4 }],
    [0x3D, { instruction: 'AND', addressing: 'ABX', cycles: 4 }],
    [0x3E, { instruction: 'ROL', addressing: 'ABX', cycles: 7 }],
    [0x40, { instruction: 'RTI', addressing: 'IMP', cycles: 6 }],
    [0x41, { instruction: 'EOR', addressing: 'INX', cycles: 6 }],
    [0x45, { instruction: 'EOR', addressing: 'ZPI', cycles: 3 }],
    [0x46, { instruction: 'LSR', addressing: 'ZPI', cycles: 5 }],
    [0x48, { instruction: 'PHA', addressing: 'IMP', cycles: 3 }],
    [0x49, { instruction: 'EOR', addressing: 'IMM', cycles: 2 }],
    [0x4A, { instruction: 'LSR', addressing: 'IMP', cycles: 2 }],
    [0x4C, { instruction: 'JMP', addressing: 'ABS', cycles: 3 }],
    [0x4D, { instruction: 'EOR', addressing: 'ABS', cycles: 4 }],
    [0x4E, { instruction: 'LSR', addressing: 'ABS', cycles: 6 }],
    [0x50, { instruction: 'BVC', addressing: 'REL', cycles: 2 }],
    [0x51, { instruction: 'EOR', addressing: 'INY', cycles: 5 }],
    [0x55, { instruction: 'EOR', addressing: 'ZPX', cycles: 4 }],
    [0x56, { instruction: 'LSR', addressing: 'ZPX', cycles: 6 }],
    [0x58, { instruction: 'CLI', addressing: 'IMP', cycles: 2 }],
    [0x59, { instruction: 'EOR', addressing: 'ABY', cycles: 4 }],
    [0x5D, { instruction: 'EOR', addressing: 'ABX', cycles: 4 }],
    [0x5E, { instruction: 'LSR', addressing: 'ABX', cycles: 7 }],
    [0x60, { instruction: 'RTS', addressing: 'IMP', cycles: 6 }],
    [0x61, { instruction: 'ADC', addressing: 'INX', cycles: 6 }],
    [0x65, { instruction: 'ADC', addressing: 'ZPI', cycles: 3 }],
    [0x66, { instruction: 'ROR', addressing: 'ZPI', cycles: 5 }],
    [0x68, { instruction: 'PLA', addressing: 'IMP', cycles: 4 }],
    [0x69, { instruction: 'ADC', addressing: 'IMM', cycles: 2 }],
    [0x6A, { instruction: 'ROR', addressing: 'IMP', cycles: 2 }],
    [0x6C, { instruction: 'JMP', addressing: 'IND', cycles: 5 }],
    [0x6D, { instruction: 'ADC', addressing: 'ABS', cycles: 4 }],
    [0x6E, { instruction: 'ROR', addressing: 'ABS', cycles: 6 }],
    [0x70, { instruction: 'BVS', addressing: 'REL', cycles: 2 }],
    [0x71, { instruction: 'ADC', addressing: 'INY', cycles: 5 }],
    [0x75, { instruction: 'ADC', addressing: 'ZPX', cycles: 4 }],
    [0x76, { instruction: 'ROR', addressing: 'ZPX', cycles: 6 }],
    [0x78, { instruction: 'SEI', addressing: 'IMP', cycles: 2 }],
    [0x79, { instruction: 'ADC', addressing: 'ABY', cycles: 4 }],
    [0x7D, { instruction: 'ADC', addressing: 'ABX', cycles: 4 }],
    [0x7E, { instruction: 'ROR', addressing: 'ABX', cycles: 7 }],
    [0x81, { instruction: 'STA', addressing: 'INX', cycles: 6 }],
    [0x84, { instruction: 'STY', addressing: 'ZPI', cycles: 3 }],
    [0x85, { instruction: 'STA', addressing: 'ZPI', cycles: 3 }],
    [0x86, { instruction: 'STX', addressing: 'ZPI', cycles: 3 }],
    [0x88, { instruction: 'DEY', addressing: 'IMP', cycles: 2 }],
    [0x8A, { instruction: 'TXA', addressing: 'IMP', cycles: 2 }],
    [0x8C, { instruction: 'STY', addressing: 'ABS', cycles: 4 }],
    [0x8D, { instruction: 'STA', addressing: 'ABS', cycles: 4 }],
    [0x8E, { instruction: 'STX', addressing: 'ABS', cycles: 4 }],
    [0x90, { instruction: 'BCC', addressing: 'REL', cycles: 2 }],
    [0x91, { instruction: 'STA', addressing: 'INY', cycles: 6 }],
    [0x94, { instruction: 'STY', addressing: 'ZPX', cycles: 4 }],
    [0x95, { instruction: 'STA', addressing: 'ZPX', cycles: 4 }],
    [0x96, { instruction: 'STX', addressing: 'ZPY', cycles: 4 }],
    [0x98, { instruction: 'TYA', addressing: 'IMP', cycles: 2 }],
    [0x99, { instruction: 'STA', addressing: 'ABY', cycles: 5 }],
    [0x9A, { instruction: 'TXS', addressing: 'IMP', cycles: 2 }],
    [0x9D, { instruction: 'STA', addressing: 'ABX', cycles: 5 }],
    [0xA0, { instruction: 'LDY', addressing: 'IMM', cycles: 2 }],
    [0xA1, { instruction: 'LDA', addressing: 'INX', cycles: 6 }],
    [0xA2, { instruction: 'LDX', addressing: 'IMM', cycles: 2 }],
    [0xA4, { instruction: 'LDY', addressing: 'ZPI', cycles: 3 }],
    [0xA5, { instruction: 'LDA', addressing: 'ZPI', cycles: 3 }],
    [0xA6, { instruction: 'LDX', addressing: 'ZPI', cycles: 3 }],
    [0xA8, { instruction: 'TAY', addressing: 'IMP', cycles: 2 }],
    [0xA9, { instruction: 'LDA', addressing: 'IMM', cycles: 2 }],
    [0xAA, { instruction: 'TAX', addressing: 'IMP', cycles: 2 }],
    [0xAC, { instruction: 'LDY', addressing: 'ABS', cycles: 4 }],
    [0xAD, { instruction: 'LDA', addressing: 'ABS', cycles: 4 }],
    [0xAE, { instruction: 'LDX', addressing: 'ABS', cycles: 4 }],
    [0xB0, { instruction: 'BCS', addressing: 'REL', cycles: 2 }],
    [0xB1, { instruction: 'LDA', addressing: 'INY', cycles: 5 }],
    [0xB4, { instruction: 'LDY', addressing: 'ZPX', cycles: 4 }],
    [0xB5, { instruction: 'LDA', addressing: 'ZPX', cycles: 4 }],
    [0xB6, { instruction: 'LDX', addressing: 'ZPY', cycles: 4 }],
    [0xB8, { instruction: 'CLV', addressing: 'IMP', cycles: 2 }],
    [0xB9, { instruction: 'LDA', addressing: 'ABY', cycles: 4 }],
    [0xBA, { instruction: 'TSX', addressing: 'IMP', cycles: 2 }],
    [0xBC, { instruction: 'LDY', addressing: 'ABX', cycles: 4 }],
    [0xBD, { instruction: 'LDA', addressing: 'ABX', cycles: 4 }],
    [0xBE, { instruction: 'LDX', addressing: 'ABY', cycles: 4 }],
    [0xC0, { instruction: 'CPY', addressing: 'IMM', cycles: 2 }],
    [0xC1, { instruction: 'CMP', addressing: 'INX', cycles: 6 }],
    [0xC4, { instruction: 'CPY', addressing: 'ZPI', cycles: 3 }],
    [0xC5, { instruction: 'CMP', addressing: 'ZPI', cycles: 3 }],
    [0xC6, { instruction: 'DEC', addressing: 'ZPI', cycles: 5 }],
    [0xC8, { instruction: 'INY', addressing: 'IMP', cycles: 2 }],
    [0xC9, { instruction: 'CMP', addressing: 'IMM', cycles: 2 }],
    [0xCA, { instruction: 'DEX', addressing: 'IMP', cycles: 2 }],
    [0xCC, { instruction: 'CPY', addressing: 'ABS', cycles: 4 }],
    [0xCD, { instruction: 'CMP', addressing: 'ABS', cycles: 4 }],
    [0xCE, { instruction: 'DEC', addressing: 'ABS', cycles: 6 }],
    [0xD0, { instruction: 'BNE', addressing: 'REL', cycles: 2 }],
    [0xD1, { instruction: 'CMP', addressing: 'INY', cycles: 5 }],
    [0xD5, { instruction: 'CMP', addressing: 'ZPX', cycles: 4 }],
    [0xD6, { instruction: 'DEC', addressing: 'ZPX', cycles: 6 }],
    [0xD8, { instruction: 'CLD', addressing: 'IMP', cycles: 2 }],
    [0xD9, { instruction: 'CMP', addressing: 'ABY', cycles: 4 }],
    [0xDD, { instruction: 'CMP', addressing: 'ABX', cycles: 4 }],
    [0xDE, { instruction: 'DEC', addressing: 'ABX', cycles: 7 }],
    [0xE0, { instruction: 'CPX', addressing: 'IMM', cycles: 2 }],
    [0xE1, { instruction: 'SBC', addressing: 'INX', cycles: 6 }],
    [0xE4, { instruction: 'CPX', addressing: 'ZPI', cycles: 3 }],
    [0xE5, { instruction: 'SBC', addressing: 'ZPI', cycles: 3 }],
    [0xE6, { instruction: 'INC', addressing: 'ZPI', cycles: 5 }],
    [0xE8, { instruction: 'INX', addressing: 'IMP', cycles: 2 }],
    [0xE9, { instruction: 'SBC', addressing: 'IMM', cycles: 2 }],
    [0xEA, { instruction: 'NOP', addressing: 'IMP', cycles: 2 }],
    [0xEC, { instruction: 'CPX', addressing: 'ABS', cycles: 4 }],
    [0xED, { instruction: 'SBC', addressing: 'ABS', cycles: 4 }],
    [0xEE, { instruction: 'INC', addressing: 'ABS', cycles: 6 }],
    [0xF0, { instruction: 'BEQ', addressing: 'REL', cycles: 2 }],
    [0xF1, { instruction: 'SBC', addressing: 'INY', cycles: 5 }],
    [0xF5, { instruction: 'SBC', addressing: 'ZPX', cycles: 4 }],
    [0xF6, { instruction: 'INC', addressing: 'ZPX', cycles: 6 }],
    [0xF8, { instruction: 'SED', addressing: 'IMP', cycles: 2 }],
    [0xF9, { instruction: 'SBC', addressing: 'ABY', cycles: 4 }],
    [0xFD, { instruction: 'SBC', addressing: 'ABX', cycles: 4 }],
    [0xFE, { instruction: 'INC', addressing: 'ABX', cycles: 7 }],
])

export const decode = (opcode: number): Test => {
    const op = matrix.get(opcode)

    if (op === undefined) {
        return {
            instruction: '???',
            addressing: 'IMP',
            cycles: 2,
        }
    }
    return op
}
