import Instruction from "./types/instruction"

class mos6502 {
    private a: number = 0x00
    private x: number = 0x00
    private y: number = 0x00
    private pc: number = 0x00 // 2 bytes, contains the next address of the program  
    private stkp: number = 0x00
    private status: number = 0x00
    private instructionMatrix: Array<Array<Instruction>> = [
        [ // Row 0
            { name: 'BRK', mode: this.IMP, op: this.ABS, cycles: 7 },
            { name: 'ORA', mode: this.IX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ORA', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'ASL', mode: this.ZP, op: this.ABS, cycles: 5 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'PHP', mode: this.IMP, op: this.ABS, cycles: 3 },
            { name: 'ORA', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'ASL', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ORA', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'ASL', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 1
            { name: 'BPL', mode: this.REL, op: this.ABS, cycles: 2 }, // **
            { name: 'ORA', mode: this.IY, op: this.ABS, cycles: 5 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ORA', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'ASL', mode: this.ZPX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CLC', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ORA', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ORA', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'ASL', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 2
            { name: 'JSR', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: 'AND', mode: this.IX, op: this.ABS, cycles: 5 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'BIT', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'AND', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'ROL', mode: this.ZP, op: this.ABS, cycles: 5 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'PLP', mode: this.IMP, op: this.ABS, cycles: 4 },
            { name: 'AND', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'ROL', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'BIT', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'ABS', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'ROL', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 3
            { name: 'BMI', mode: this.REL, op: this.ABS, cycles: 2 }, // **
            { name: 'AND', mode: this.IY, op: this.ABS, cycles: 5 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'AND', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'ROL', mode: this.ZPX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'SEC', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'AND', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'AND', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'ROL', mode: this.ABX, op: this.ABS, cycles: 7 },
        ],
        [ // Row 4
            { name: 'RTI', mode: this.IMP, op: this.ABS, cycles: 6 },
            { name: 'EOR', mode: this.IX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'EOR', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'LSR', mode: this.ZP, op: this.ABS, cycles: 5 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'PHA', mode: this.IMP, op: this.ABS, cycles: 3 },
            { name: 'EOR', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'LSR', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'JMP', mode: this.ABS, op: this.ABS, cycles: 3 },
            { name: 'EOR', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'LSR', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 5
            { name: 'BVC', mode: this.REL, op: this.ABS, cycles: 2 }, // **
            { name: 'EOR', mode: this.IY, op: this.ABS, cycles: 5 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'EOR', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'LSR', mode: this.ZPX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CLI', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'EOR', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'EOR', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'LSR', mode: this.ABX, op: this.ABS, cycles: 7 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 6
            { name: 'RTS', mode: this.IMP, op: this.ABS, cycles: 6 },
            { name: 'ADC', mode: this.IX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ADC', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'ROR', mode: this.ZP, op: this.ABS, cycles: 5 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'PLA', mode: this.IMP, op: this.ABS, cycles: 4 },
            { name: 'ADC', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'ROR', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'JMP', mode: this.IND, op: this.ABS, cycles: 5 },
            { name: 'ADC', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'ROR', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 7
            { name: 'BVS', mode: this.REL, op: this.ABS, cycles: 2 }, // **
            { name: 'ADC', mode: this.IY, op: this.ABS, cycles: 5 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ADC', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'ROR', mode: this.ZPX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'SEI', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ADC', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'ADC', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'ROR', mode: this.ABX, op: this.ABS, cycles: 7 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 8
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'STA', mode: this.IX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'STY', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'STA', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'STX', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'DEY', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'TXA', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'STY', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'STA', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'STX', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row 9
            { name: 'BCC', mode: this.REL, op: this.ABS, cycles: 2 }, // **
            { name: 'STA', mode: this.IY, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'STY', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'STA', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'STX', mode: this.ZPY, op: this.ABS, cycles: 4 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'TYA', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'STA', mode: this.ABY, op: this.ABS, cycles: 5 },
            { name: 'TXS', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'STA', mode: this.ABX, op: this.ABS, cycles: 5 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row A
            { name: 'LDY', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'LDA', mode: this.IX, op: this.ABS, cycles: 6 },
            { name: 'LDX', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'LDY', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'LDA', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'LDX', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'TAY', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'LDA', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'TAX', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'LDY', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'LDA', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'LDX', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row B
            { name: 'BCS', mode: this.REL, op: this.ABS, cycles: 2 }, // **
            { name: 'LDA', mode: this.IY, op: this.ABS, cycles: 5 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'LDY', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'LDA', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'LDX', mode: this.ZPY, op: this.ABS, cycles: 4 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CLV', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'LDA', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: 'TSX', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'LDY', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'LDA', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'LDX', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row C
            { name: 'CPY', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'CMP', mode: this.IX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CPY', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'CMP', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'DEC', mode: this.ZP, op: this.ABS, cycles: 5 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'INY', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CMP', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'DEX', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CPY', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'CMP', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'DEC', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row D
            { name: 'BNE', mode: this.REL, op: this.ABS, cycles: 2 }, // **
            { name: 'CMP', mode: this.IY, op: this.ABS, cycles: 5 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CMP', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'DEC', mode: this.ZPX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CLD', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CMP', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CMP', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'DEC', mode: this.ABX, op: this.ABS, cycles: 7 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row E
            { name: 'CPX', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'SBC', mode: this.IX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CPX', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'SBC', mode: this.ZP, op: this.ABS, cycles: 3 },
            { name: 'INC', mode: this.ZP, op: this.ABS, cycles: 5 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'INX', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'SBC', mode: this.IMM, op: this.ABS, cycles: 2 },
            { name: 'NOP', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'CPX', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'SBC', mode: this.ABS, op: this.ABS, cycles: 4 },
            { name: 'INC', mode: this.ABS, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ],
        [ // Row F
            { name: 'BEO', mode: this.REL, op: this.ABS, cycles: 2}, // **
            { name: 'SBC', mode: this.IY, op: this.ABS, cycles: 5 },// *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'SBC', mode: this.ZPX, op: this.ABS, cycles: 4 },
            { name: 'INC', mode: this.ZPX, op: this.ABS, cycles: 6 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'SED', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'SBC', mode: this.ABY, op: this.ABS, cycles: 4 }, // *
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
            { name: 'SBC', mode: this.ABX, op: this.ABS, cycles: 4 }, // *
            { name: 'INC', mode: this.ABX, op: this.ABS, cycles: 7 },
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 },
        ]
    ]

    /**
     * Addressing modes
     */

    private read(addr: number): number {
        return 0
    }

    // Immediate
    private IMM(): number {
        const operand = this.read(this.pc + 1)

        this.pc = this.pc += 2
        //  op(operand)


        return 0
    }

    // Implicit
    // Instructions like RTS or CLC have no address operand, the destination of results are implied. 
    private IMP(): number {
        return 0
    }

    // Relative addressing
    // used on branching to establish a destination
    // Second byte is an 
    private REL(): number {
        const offset = this.read(this.pc + 1) & 0xFF

        // op(offset)
        return 0
    }

    /**
     * Zero Page address mode.
     * Assume that the higher byte will be 0x00 (page 1)
     * Read a byte from PC to get the 8 lower bits of the address.
     */
    private ZP(): number {
        const low = this.read(this.pc + 1) & 0xFF

        this.pc = this.pc + 2

        const addr = low & 0xFF
        // op(addr)
        return 0
    }

    /**
     * Indexed Zero Page (X) addressing.
     * Read a byte from PC to get the 8 lower bits of the address.
     * Read a byte from PC to get the 8 lower bits of the address.
     */
    private ZPX(): number {
        const offset = this.read(this.pc + this.x) & 0xFF
        this.pc = this.pc + 1
        // op(offset)
        return 0
    }

    /**
     * Indexed Zero Page (X) addressing.
     * Read a byte from PC to get the 8 lower bits of the address.
     * Read a byte from PC to get the 8 lower bits of the address.
     */
    private ZPY(): number {
        const offset = this.read(this.pc + this.y) & 0xFF
        this.pc = this.pc + 1
        // op(offset)
        return 0
    }

    /**
     * Absolute address mode.
     * Read one byte from PC to get the 8 lower bits of the address.
     * Read a second byte from PC to get the 8 higher bits of the address.
     */
    private ABS(): number {
        const low = this.read(this.pc + 1)
        const high = this.read(this.pc + 2)
        this.pc = this.pc + 3

        const addr = ((high << 8) | low) & 0xFFFF 

        // op(addr)
        return 0
    }

    // Absolute indexed X
    private ABX(): number {
        const low = this.read(this.pc + this.x)
        const high = this.read(this.pc + this.x)
        this.pc = this.pc + 3

        const addr = ((high << 8) | low) & 0xFFFF 

        return ((addr & 0xFF00) != (high << 8)) ? 1 : 0
        // op(addr)
        return 0
    }

    // Absolute indexed Y
    private ABY(): number {
        const low = this.read(this.pc + this.y)
        const high = this.read(this.pc + this.y)
        this.pc = this.pc + 3

        const addr = ((high << 8) | low) & 0xFFFF 

        return ((addr & 0xFF00) != (high << 8)) ? 1 : 0
            // return op() + 1
        // return op(addr)
        return 0
    }

    // Indirect
    private IND(): number {
        return 0
    }

    // Indirect X
    private IX(): number {
        return 0
    }

    // Indirect Y
    private IY(): number {
        return 0
    }
}

export default mos6502
