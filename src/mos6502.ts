import Flags from "./types/flags"
import Instruction from "./types/instruction"

type AddressingMode =
    'IMP' | 'IMM' | 'ABS' | 'ABX' | 'ABY' | 'IND' | 'INX' | 'INY' | 'REL' | 'ZPI' | 'ZPX' | 'ZPY'


class mos6502 {
    private a: number = 0x00
    private x: number = 0x00
    private y: number = 0x00
    private pc: number = 0x00 // 2 bytes, contains the next address of the program  
    private stkp: number = 0x00
    private status: number = 0x00

    private currentInstruction: Instruction = { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }
    
    // looking for a way to remove the matrix from this class, it takes too much space and it makes me want
    // to add this project to my pile of shame
    // 48 out of 57 instructions




    // Illegal instruction will have their special function, I don't think ill implement them so it might be NOPd
    private instructionMatrix: Array<Instruction> = [
            // Row 0
            { name: 'BRK', mode: this.IMP, op: this.BRK, cycles: 7 }, // check
            { name: 'ORA', mode: this.IX, op: this.ORA, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'ORA', mode: this.ZP, op: this.ORA, cycles: 3 }, //check
            { name: 'ASL', mode: this.ZP, op: this.ASL, cycles: 5 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'PHP', mode: this.IMP, op: this.PHP, cycles: 3 }, // check
            { name: 'ORA', mode: this.IMM, op: this.ORA, cycles: 2 }, // check
            { name: 'ASL', mode: this.IMP, op: this.ASL, cycles: 2 }, // check - this is implied even if acc, no need to fetch data
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'ORA', mode: this.ABS, op: this.ORA, cycles: 4 }, // check
            { name: 'ASL', mode: this.ABS, op: this.ASL, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
              // Row 1
            { name: 'BPL', mode: this.REL, op: this.BPL, cycles: 2 }, // check
            { name: 'ORA', mode: this.IY, op: this.ORA, cycles: 5 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'ORA', mode: this.ZPX, op: this.ORA, cycles: 4 }, // check
            { name: 'ASL', mode: this.ZPX, op: this.ASL, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'CLC', mode: this.IMP, op: this.CLC, cycles: 2 }, // check
            { name: 'ORA', mode: this.ABY, op: this.ORA, cycles: 4 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'ORA', mode: this.ABX, op: this.ORA, cycles: 4 }, // check
            { name: 'ASL', mode: this.ABX, op: this.ASL, cycles: 7 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            // Row 2
            { name: 'JSR', mode: this.ABS, op: this.JSR, cycles: 6 }, // check
            { name: 'AND', mode: this.IX, op: this.AND, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'BIT', mode: this.ZP, op: this.BIT, cycles: 3 }, // check
            { name: 'AND', mode: this.ZP, op: this.AND, cycles: 3 }, // check
            { name: 'ROL', mode: this.ZP, op: this.ROL, cycles: 5 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'PLP', mode: this.IMP, op: this.PLP, cycles: 4 }, // check
            { name: 'AND', mode: this.IMM, op: this.AND, cycles: 2 }, // check
            { name: 'ROL', mode: this.IMP, op: this.ROL, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'BIT', mode: this.ABS, op: this.BIT, cycles: 4 }, // check
            { name: 'AND', mode: this.ABS, op: this.AND, cycles: 4 }, // check
            { name: 'ROL', mode: this.ABS, op: this.ROL, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            // Row 3
            { name: 'BMI', mode: this.REL, op: this.BMI, cycles: 2 }, // check
            { name: 'AND', mode: this.IY, op: this.AND, cycles: 5 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'AND', mode: this.ZPX, op: this.AND, cycles: 4 }, // check
            { name: 'ROL', mode: this.ZPX, op: this.ROL, cycles: 6 },  // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'SEC', mode: this.IMP, op: this.SEC, cycles: 2 }, // check
            { name: 'AND', mode: this.ABY, op: this.AND, cycles: 4 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'AND', mode: this.ABX, op: this.AND, cycles: 4 }, // check
            { name: 'ROL', mode: this.ABX, op: this.ROL, cycles: 7 }, // check
            // Row 4
            { name: 'RTI', mode: this.IMP, op: this.RTI, cycles: 6 }, // check
            { name: 'EOR', mode: this.IX, op: this.EOR, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'EOR', mode: this.ZP, op: this.EOR, cycles: 3 }, //check
            { name: 'LSR', mode: this.ZP, op: this.LSR, cycles: 5 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'PHA', mode: this.IMP, op: this.PHA, cycles: 3 }, // check
            { name: 'EOR', mode: this.IMM, op: this.EOR, cycles: 2 }, // check
            { name: 'LSR', mode: this.IMP, op: this.LSR, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'JMP', mode: this.ABS, op: this.JMP, cycles: 3 }, // check
            { name: 'EOR', mode: this.ABS, op: this.EOR, cycles: 4 }, // check
            { name: 'LSR', mode: this.ABS, op: this.LSR, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            // Row 5
            { name: 'BVC', mode: this.REL, op: this.BVC, cycles: 2 }, // check
            { name: 'EOR', mode: this.IY, op: this.EOR, cycles: 5 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'EOR', mode: this.ZPX, op: this.EOR, cycles: 4 }, // check
            { name: 'LSR', mode: this.ZPX, op: this.LSR, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'CLI', mode: this.IMP, op: this.CLI, cycles: 2 }, // check
            { name: 'EOR', mode: this.ABY, op: this.EOR, cycles: 4 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'EOR', mode: this.ABX, op: this.EOR, cycles: 4 }, // check
            { name: 'LSR', mode: this.ABX, op: this.LSR, cycles: 7 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            // Row 6
            { name: 'RTS', mode: this.IMP, op: this.RTS, cycles: 6 }, // check
            { name: 'ADC', mode: this.IX, op: this.ABS, cycles: 6 }, // later cuz hard to understand
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'ADC', mode: this.ZP, op: this.ABS, cycles: 3 }, // later cuz hard to understand
            { name: 'ROR', mode: this.ZP, op: this.ROR, cycles: 5 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'PLA', mode: this.IMP, op: this.PLA, cycles: 4 }, // check 
            { name: 'ADC', mode: this.IMM, op: this.ABS, cycles: 2 },  // later cuz hard to understand
            { name: 'ROR', mode: this.IMP, op: this.ROR, cycles: 2 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            { name: 'JMP', mode: this.IND, op: this.JMP, cycles: 5 }, // check
            { name: 'ADC', mode: this.ABS, op: this.ABS, cycles: 4 }, // later cuz hard to understand
            { name: 'ROR', mode: this.ABS, op: this.ROR, cycles: 6 }, // check
            { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }, // check
            // Row 7
            { name: 'BVS', mode: this.REL, op: this.BVS, cycles: 2 },
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
            // Row 8
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
            // Row 9
            { name: 'BCC', mode: this.REL, op: this.BCC, cycles: 2 },
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
            // Row A
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
            // Row B
            { name: 'BCS', mode: this.REL, op: this.BCS, cycles: 2 },
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
            // Row C
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
            // Row D
            { name: 'BNE', mode: this.REL, op: this.BNE, cycles: 2 },
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
            // Row E
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
            // Row F
            { name: 'BEQ', mode: this.REL, op: this.BEQ, cycles: 2},
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

    public simulate() {
        const opcode = this.read(this.pc) & 0xFF
        this.currentInstruction = this.instructionMatrix[opcode]


    }

    public getFlag (flag: Flags) {
        // Create a bitmask by shifting 1 to the left by n positions
      const mask = 1 << flag;
      // Use bitwise AND to extract the bit at position n
      return (this.status & mask) !== 0 ? 1 : 0
  }

    public setFlag(flag: Flags, value: boolean) {
        const mask = (1 << flag) & 0xFF;

        this.status = (value) ? this.status | mask : this.status & ~mask
        return
    }

    /**
     * Addressing modes
     */

    private write(addr: number, value: number) {

    }

    private read(addr: number): number {
        return 0
    }

    // Immediate
    private IMM(): number {
        const operand = this.pc + 1

        this.pc = this.pc += 2
        //  op(operand)


        return 0
    }

    // Implicit
    // Instructions like RTS or CLC have no address operand, the destination of results are implied. 
    private IMP(): number {
        // ACC?
        return 0
    }

    // Relative addressing
    // used on branching to establish a destination
    // Second byte is an 
    private REL(): number {
        const offset = this.read(this.pc) & 0xFF

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

    /**
     * https://www.nesdev.org/obelisk-6502-guide/reference.html
     * todo: check potential overflow (js is working in 64bits and no way to use 16bits or 8 bits)
     * this mean potential issue on any sub or add made on a number
     */

    private AND(address: number) {
        const m = this.read(address)

        this.a = this.a & m

        this.setFlag(Flags.Z, this.a === 0)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    /**
     * Arythmetic shift left
     * @param address 
     * @returns 
     */
    private ASL(address: number) {
        const implied: boolean = (this.currentInstruction.mode === this.IMP)
        const data: number = (implied ? this.a : this.read(address)) & 0xFF
        const result: number = data << 1

        this.setFlag(Flags.C, (data & 0x80) === 0x01) // might need a check
        this.setFlag(Flags.N, (result & 0x80) === 0x01)
        this.setFlag(Flags.Z, (result & 0xFF) === 0x00)

        if (implied === true) {
            this.a = result & 0x00FF
        } else {
            this.write(address, result)
        }
        return 0
    }

    /**
     * Branch if Carry Clear
     * @param relativeAddress 
     * @returns 
     */
    private BCC(relativeAddress: number) {
        if (this.getFlag(Flags.C) === 1) {
            return 0
        }
        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    /**
     * Branch if Carry Clear
     * @param relativeAddress 
     * @returns 
     */
    private BCS(relativeAddress: number) {
        if (this.getFlag(Flags.C) === 0) {
            return 0
        }
        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    /**
     * Branch if Equal
     * @param relativeAddress 
     * @returns 
     */
    private BEQ(relativeAddress: number) {
        if (this.getFlag(Flags.Z) === 0) {
            return 0
        }

        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    // Does it take a cycle if carry is set or overflow is set??
    private BIT(address: number) {
        const value = this.read(address)
        const res = this.a & value

        this.setFlag(Flags.V, (res & 0x40) === 1)
        this.setFlag(Flags.N, (res & 0x80) === 1)
        return 0
    }

    /**
     * Branch if Minus
     * @param relativeAddress 
     * @returns 
     */
    private BMI(relativeAddress: number) {
        if (this.getFlag(Flags.N) === 0) {
            return 0
        }

        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    /**
     * Branch if Not Equal
     * @param relativeAddress 
     * @returns 
     */
    private BNE(relativeAddress: number) {
        if (this.getFlag(Flags.Z) === 1) {
            return 0
        }

        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    /**
     * Branch if Positive
     * @param relativeAddress 
     * @returns 
     */
    private BPL(relativeAddress: number) {
        if (this.getFlag(Flags.N) === 1) {
            return 0
        }

        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BRK() { //todo: find offset of stack
        const low = this.read(0xFFFF)
        const high = this.read(0xFFFE)

        this.setFlag(Flags.B, true)
        this.setFlag(Flags.I, true);
        this.write(this.stkp, (this.pc >> 8) & 0x00FF)
        this.write(this.stkp - 1, this.pc & 0x00FF)
        this.write(this.stkp - 2, this.status)
        this.stkp = this.stkp - 3
        this.pc = ((high << 8) | low) & 0xFFFF 
        return 0
    }

    /**
     * Branch if Overflow Clear
     * @param relativeAddress 
     * @returns 
     */
    private BVC(relativeAddress: number) {
        if (this.getFlag(Flags.V) === 1) {
            return 0
        }

        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    /**
     * Branch if Overflow Set
     * @param relativeAddress 
     * @returns 
     */
    private BVS(relativeAddress: number) {
        if (this.getFlag(Flags.V) === 0) {
            return 0
        }

        const oldAddress = this.pc & 0xFFFF
        this.pc  = oldAddress + relativeAddress & 0xFFFF
        
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private CLC() {
        this.setFlag(Flags.C, false)
    }

    private CLD() {
        this.setFlag(Flags.D, false)
    }

    private CLI() {
        this.setFlag(Flags.I, false)
    }

    private CLV() {
        this.setFlag(Flags.V, false)
    }

    private LDA(address: number) {
        this.a = this.read(address)

        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private LDX(address: number) {
        this.x = this.read(address)

        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) === 1)
        return 0
    }

    private LDY(address: number) {
        this.y = this.read(address)

        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) === 1)
        return 0
    }

    private NOP() {
        this.pc = this.pc + 1
        return
    }

    /**
     * Set Carry Flag
     */
    private SEC() {
        this.setFlag(Flags.C, true)
    }

    /**
     * Set Decimal Flag
     */
    private SED() {
        this.setFlag(Flags.D, true)
    }

    /**
     * Set Interrupt Disable
     */
    private SEI() {
        this.setFlag(Flags.I, true)
    }

    private TAX() {
        this.x = this.a

        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) === 1)
        return 0
    }

    private TAY() {
        this.y = this.a

        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) === 1)
        return 0
    }

    private TSX() {
        this.x = this.stkp

        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) === 1)
    }

    private TXA() {
        this.a = this.x

        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private TXS() {
        this.stkp = this.x
        return 0
    }

    private TYA() {
        this.a = this.y

        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private CMP(address: number) {
        const m = this.read(address)

        this.setFlag(Flags.Z, this.a === m)
        this.setFlag(Flags.C, this.a >= m)
        this.setFlag(Flags.N, ((this.a - m) & 0x80) === 1)
        return
    }

    private CPX(address: number) {
        const m = this.read(address)

        this.setFlag(Flags.Z, this.x === m)
        this.setFlag(Flags.C, this.x >= m)
        this.setFlag(Flags.N, (((this.x - m) & 0xFF) & 0x80) === 1)
        return
    }

    private CPY(address: number) {
        const m = this.read(address)

        this.setFlag(Flags.Z, this.y === m)
        this.setFlag(Flags.C, this.y >= m)
        this.setFlag(Flags.N, (((this.y - m) & 0xFF) & 0x80) === 1)
        return
    }

    private DEC(address: number) {
        const m = this.read(address)
        const result = (m - 1) & 0x00FF

        this.write(address, result)
        this.setFlag(Flags.Z, result === 0)
        this.setFlag(Flags.N, (result & 0x80) === 1)
        
    }

    private DEX() {
        this.x = (this.x - 1) & 0x00FF

        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) === 1)
    }

    private DEY() {
        this.y = (this.y - 1) & 0x00FF

        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) === 1)
    }

    private EOR(address: number) {
        const m = this.read(address)

        this.a = this.a ^ m

        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
    }

    private ORA(address) {
        const m = this.read(address)

        this.a = this.a | m

        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return
    }

    private PHP() {
        this.write(this.stkp, this.status)
        this.stkp = this.stkp - 1
    }

    private JSR(address) {
        this.write(this.stkp, ((this.pc - 1) >> 8) & 0x00FF)
        this.write(this.stkp - 1, (this.pc - 1) & 0x00FF)
        this.stkp = this.stkp - 2
        this.pc = address
    }

    // i need to do something about accumulator and the way i fetch data, things are getting out of hands already
    private ROL(address) {
        const accumulator = this.currentInstruction.mode === this.IMP

        if (accumulator) {
            this.setFlag(Flags.C, (this.a & 0x80) === 1)
            this.a = (this.a >> 1)
            this.setFlag(Flags.N, (this.a & 0x80) === 1)
        } else {
            let m = this.read(address)

            this.setFlag(Flags.C, (m & 0x80) === 1)
            m = (m >> 1) & 0x00FF
            this.setFlag(Flags.N, (m & 0x80) === 1)
            this.write(address, m)
        }
    }

    private PLA() {
        const m = this.read(this.stkp)
        this.stkp = this.stkp + 1
        this.a = m

        this.setFlag(Flags.Z, m === 0)
        this.setFlag(Flags.N, (m & 0x80) === 1)
    }

    private PLP() {
        this.status = this.read(this.stkp)
        this.stkp = this.stkp + 1
    }

    private RTI() {
        this.status = this.read(this.stkp)
        this.pc = (this.read(this.stkp + 1) >> 8) + this.read(this.stkp + 2)
        this.stkp = this.stkp + 3
    }

    private LSR(address: number) {
        const implied: boolean = (this.currentInstruction.mode === this.IMP)
        const data: number = (implied ? this.a : this.read(address)) & 0xFF
        const result: number = (data >> 1) & 0xFF

        this.setFlag(Flags.C, (data & 0x80) === 0x01) // might need a check
        this.setFlag(Flags.N, (result & 0x80) === 0x01)
        this.setFlag(Flags.Z, (result & 0xFF) === 0x00)

        if (implied === true) {
            this.a = result & 0x00FF
        } else {
            this.write(address, result)
        }
        return 0
    }

    private PHA() {
        this.write(this.stkp, this.a)
        this.stkp = this.stkp + 1
    }

    private JMP(address) {
        this.pc = address
    }

    private RTS() {
        this.pc = this.read(this.stkp + 1);
        this.pc |= this.read(this.stkp + 2) << 8;
        this.stkp = this.stkp + 3
        this.pc = this.pc + 1;
        return 0;
    }

    // i need to do something about accumulator and the way i fetch data, things are getting out of hands already
    private ROR(address) {
        const accumulator = this.currentInstruction.mode === this.IMP

        if (accumulator) {
            this.setFlag(Flags.C, (this.a & 0x80) === 1)
            this.a = (this.a << 1)
            this.setFlag(Flags.N, (this.a & 0x80) === 1)
        } else {
            let m = this.read(address)

            this.setFlag(Flags.C, (m & 0x80) === 1)
            m = (m >> 1) & 0x00FF
            this.setFlag(Flags.N, (m & 0x80) === 1)
            this.write(address, m)
        }
    }
}

export default mos6502
