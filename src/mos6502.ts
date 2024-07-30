import DebugInfo from "./types/debug"
import Flags from "./types/flags"
import RegistersInfo from "./types/register"

import { AddressingModesMap } from "./addressing"
import { Instruction, InstructionsMap } from "./instructions"
import decode from "./decoder"

class mos6502 {
    private a: number = 0x00
    private x: number = 0x00
    private y: number = 0x00
    private pc: number = 0x00
    private stkp: number = 0x00
    private status: number = 0x00
    private addressingModes: AddressingModesMap
    private instructionsMap: InstructionsMap
    private addr: number = 0x00
    private currentInstruction: Instruction = { instruction: '???', addressing: 'IMP', cycles: 2 }
    private cycle: number = 0
    private read: (address: number) => number
    private write: (address: number, value: number) => void

    /** Debug Only */
    private debug: boolean

    constructor(read: (address: number) => number, write: (address: number, value: number) => void, debug: boolean = false) {

        this.addressingModes = {
            IMP: this.IMP, IMM: this.IMM, ABS: this.ABS, ABX: this.ABX, ABY: this.ABY, IND: this.IND,
            INX: this.IX , INY: this.IY , REL: this.REL, ZPI: this.ZP , ZPX: this.ZPX, ZPY: this.ZPY,
            ACC: this.IMP,
        }
        this.instructionsMap = {
            ADC: this.ADC, AND: this.AND, ASL: this.ASL, BCC: this.BCC, BCS: this.BCS, BEQ: this.BEQ, 
            BIT: this.BIT, BMI: this.BMI, BNE: this.BNE, BPL: this.BPL, BRK: this.BRK, BVC: this.BVC,
            BVS: this.BVS, CLC: this.CLC, CLD: this.CLD, CLI: this.CLI, CLV: this.CLV, CMP: this.CMP,
            CPX: this.CPX, CPY: this.CPY, DEC: this.DEC, DEX: this.DEX, DEY: this.DEY, EOR: this.EOR,
            INC: this.INC, INX: this.INX, INY: this.INY, JMP: this.JMP, JSR: this.JSR, LDA: this.LDA,
            LDX: this.LDX, LDY: this.LDY, LSR: this.LSR, NOP: this.NOP, ORA: this.ORA, PHA: this.PHA,
            PHP: this.PHP, PLA: this.PLA, PLP: this.PLP, ROL: this.ROL, ROR: this.ROR, RTI: this.RTI,
            RTS: this.RTS, SBC: this.SBC, SEC: this.SEC, SED: this.SED, SEI: this.SEI, STA: this.STA,
            STX: this.STX, STY: this.STY, TAX: this.TAX, TAY: this.TAY, TSX: this.TSX, TXA: this.TXA,
            TXS: this.TXS, TYA: this.TYA, '???': this.ILL,
        }
        this.read = read
        this.write = write

        this.reset()
        this.cycle = 0
        this.debug = debug
    }

    public emulate = (): { cycle: number, processorStatus: { info: Array<DebugInfo>, registers: RegistersInfo } | null} => {
        let processorStatus = null

        if (this.cycle === 0) {
            this.setFlag(Flags.A, true)
            const pc = this.pc

            this.currentInstruction = decode(this.read(this.pc) & 0xFF)
            this.pc = this.pc + 1
            this.cycle = this.currentInstruction.cycles
            this.cycle = this.cycle + this.addressingModes[this.currentInstruction.addressing]()
            this.cycle = this.cycle + this.instructionsMap[this.currentInstruction.instruction]()
            processorStatus = this.getProcessorStatus(pc)
            this.setFlag(Flags.A, true)
        }
        this.cycle = this.cycle - 1
        return {
            cycle: this.cycle,
            processorStatus,
        }
    }

    public getFlag = (flag: Flags) => {
      const mask = 1 << flag & 0xFF;

      return (this.status & mask) !== 0 ? 1 : 0
    }

    public setFlag = (flag: Flags, value: boolean) => {
        const mask = 1 << flag

        if (value) {
            this.status |= mask;
        } else {
            this.status &= ~mask;
        }
        return
    }

    public reset() {
	    const lo = this.read(0xFFFC + 0)
	    const hi = this.read(0xFFFC + 1)

	    this.pc = (hi << 8) | lo
	    this.a = 0
	    this.x = 0
	    this.y = 0
	    this.stkp = 0xFF
	    this.status = 0x00
        this.setFlag(Flags.B, true)
        this.setFlag(Flags.I, true)
        this.setFlag(Flags.Z, true)
        this.setFlag(Flags.A, true)
	    this.cycle = 8
    }


    /* Addressing modes */


    /**
     * Implied Addressing mode.
     * 
     * No address operand, we do nothing
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IMP = (): number => {
        return 0
    }

    /**
     * Immediate Addressing mode.
     * 
     * Use the next byte as a value
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IMM = (): number => {
        this.addr = this.pc
        this.pc = (this.pc + 1) & 0xFFFF
        return 0
    }

    /**
     * Absolute Addressing mode.
     * 
     * The address of the value that the instruction will use is located in the next to bytes.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private ABS = (): number => {
        const low = this.read(this.pc)
        const high = this.read((this.pc + 1) & 0xFFFF)

        this.pc = (this.pc + 2) & 0xFFFF
        this.addr = (high << 8) | low
        return 0
    }

    /**
     * Absolute with X index Addressing mode.
     * 
     * The address of the value that the instruction will use is located in the next to bytes.
     * @returns {number} 1 if a page is crossed, else 0.
     */
    private ABX = (): number => {
        const low = this.read(this.pc)
        const high = this.read((this.pc + 1) & 0xFFFF)

        this.pc = (this.pc + 2) & 0xFFFF
        this.addr = (((high << 8) | low) + this.x) & 0xFFFF
        if (this.currentInstruction.instruction === 'STA') {
            return 0
        }
        return (this.addr & 0xFF00) === ((high << 8) & 0xFF00) ? 0 : 1;
    }

    /**
     * Absolute with Y index Addressing mode.
     * 
     * The address of the value that the instruction will use is located in the next to bytes.
     * @returns {number} 1 if a page is crossed, else 0.
     */
    private ABY = (): number => {
        const low = this.read(this.pc)
        const high = this.read((this.pc + 1) & 0xFFFF)

        this.pc = (this.pc + 2) & 0xFFFF
        this.addr = (((high << 8) | low) + this.y) & 0xFFFF
        if (this.currentInstruction.instruction === 'STA') {
            return 0
        }
        return (this.addr & 0xFF00) === (high << 8) ? 0 : 1
    }

    /**
     * Indirect Addressing mode.
     * 
     * Read two bytes to form a 16 bits address. These two bytes are located
     * at the address that we get after reading the next two bytes.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IND = (): number => {
        const low = this.read(this.pc);
        const high = this.read((this.pc + 1) & 0xFFFF);
        const address = (high << 8) | low;
    
        this.pc = (this.pc + 2) & 0xFFFF;
    
        // Handle the page boundary bug
        const indirectLow = this.read(address);
        const indirectHigh = this.read((address & 0xFF00) | ((address + 1) & 0x00FF));
    
        this.addr = (indirectHigh << 8) | indirectLow;
        return 0;
    }

    /**
     * Indirect with X index Addressing mode.
     * 
     * Indirect with an offset equal to X.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IX = (): number => {
        const loc = this.read(this.pc);

        this.pc = (this.pc + 1) & 0xFFFF
        this.addr = (this.read((loc + this.x + 1) & 0xFF) << 8) | this.read(loc + this.x & 0xFF)   
        return 0
    }

    /**
     * Indirect with Y index Addressing mode.
     * 
     * Indirect with an offset equal to Y.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IY = (): number => {
        const loc = this.read(this.pc);
        const baseLo = this.read(loc & 0xFF);
        const baseHi = this.read((loc + 1) & 0xFF);
        const baseAddr = (baseHi << 8) | baseLo;
        this.addr = (baseAddr + this.y) & 0xFFFF;
        this.pc = (this.pc + 1) & 0xFFFF;

        if (this.currentInstruction.instruction === 'STA') {
            return 0
        }
        return (this.addr & 0xFF00) === (baseAddr & 0xFF00) ? 0 : 1
    }

    /**
     * Relative Addressing mode.
     *
     * Used by branching instruction. A signed one byte offset is used to indicate the jump location.
     * @returns 
     */
    private REL = (): number => {
        this.addr = this.read(this.pc) & 0xFF
        this.pc = this.pc + 1


        if (this.addr & 0x80) {
            this.addr = this.addr | 0xFF00
        }
        return 0
    }

    /**
     * Zero Page Addressing mode.
     * 
     * We assume that the value is located on page 0, at the offset indicated by the next byte.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private ZP = (): number => {
        const low = this.read(this.pc)

        this.addr = low & 0xFF
        this.pc = (this.pc + 1) & 0xFFFF
        return 0
    }

    /**
     * Zero Page with X index Addressing mode.
     * 
     * We assume that the value is located on page 0, at the offset indicated by the next + x byte.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private ZPX = (): number => {
        const base = this.read(this.pc) & 0x00FF
        this.addr = (base + this.x) & 0x00FF
        this.pc = (this.pc + 1) & 0xFFFF
        return 0;
    }

    /**
     * Zero Page with X index Addressing mode.
     * 
     * We assume that the value is located on page 0, at the offset indicated by the next + y byte.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private ZPY = (): number => {
        const base = this.read(this.pc) & 0x00FF
        this.addr = (base + this.y) & 0x00FF
        this.pc = (this.pc + 1) & 0xFFFF
        return 0;
    }

    
    /**
     * Instructions
     * reference: https://www.nesdev.org/obelisk-6502-guide/reference.html
     */


    private ADC = (): number => {
        const m = this.read(this.addr)

        if (this.getFlag(Flags.D)) {
            let lowerNibble = (this.a & 0x0F) + (m & 0x0F) + this.getFlag(Flags.C);
            let upperNibble = (this.a >> 4) + (m >> 4);

            if (lowerNibble > 9) {
                lowerNibble -= 10;
                upperNibble += 1;
            }
            if (upperNibble > 9) {
                upperNibble -= 10;
                this.setFlag(Flags.C, true)
            } else {
                this.setFlag(Flags.C, false)
            }
            this.a = ((upperNibble << 4) | (lowerNibble & 0x0F)) & 0xFF;
        } else {
            const result = this.a + m + this.getFlag(Flags.C);

            this.setFlag(Flags.V, ((this.a ^ result) & (m ^ result) & 0x80) !== 0)
            this.setFlag(Flags.C, result > 0xFF);
            this.a = result & 0x00FF;
        }

        this.setFlag(Flags.Z, this.a === 0)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private AND = (): number => {
        const m = this.read(this.addr)

        this.a = this.a & m
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private ASL = (): number => {
        const implied: boolean = (this.currentInstruction.addressing === 'ACC')
        const data: number = (implied ? this.a : this.read(this.addr))
        const result: number = (data << 1) & 0x00FF

        this.setFlag(Flags.C, (data & 0x80) !== 0)
        this.setFlag(Flags.N, (result & 0x80) !== 0)
        this.setFlag(Flags.Z, (result & 0xFF) === 0)

        if (implied === true) {
            this.a = result
        } else {
            this.write(this.addr, result)
        }
        return 0
    }

    private BCC = (): number => {
        if (this.getFlag(Flags.C) === 1) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BCS = (): number => {
        if (this.getFlag(Flags.C) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BEQ = (): number => {
        if (this.getFlag(Flags.Z) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BIT = (): number => {
        const m = this.read(this.addr)
        const result = this.a & m

        this.setFlag(Flags.Z, (result === 0x00))
        this.setFlag(Flags.V, (m & 0x40) !== 0)
        this.setFlag(Flags.N, (m & 0x80) !== 0)
        return 0
    }

    private BMI = (): number => {
        if (this.getFlag(Flags.N) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BNE = (): number => {
        if (this.getFlag(Flags.Z) === 1) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BPL = (): number => {
        if (this.getFlag(Flags.N) === 1) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BRK = (): number => { //todo: find offset of stack
        const low = this.read(0xFFFE)
        const high = this.read(0xFFFF)

        this.setFlag(Flags.B, true)
        this.pc = this.pc + 1
        this.write(0x100 + this.stkp, (this.pc >> 8) & 0x00FF)
        this.write(0x100 + this.stkp - 1, this.pc & 0x00FF)
        this.write(0x100 + this.stkp - 2, this.status)
        this.setFlag(Flags.I, true)
        this.stkp = this.stkp - 3
        this.pc = ((high << 8) | low) & 0xFFFF 
        return 0
    }

    private BVC = (): number => {
        if (this.getFlag(Flags.V) === 1) {
            return 0
        }

        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BVS = (): number => {
        if (this.getFlag(Flags.V) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private CLC = (): number => {
        this.setFlag(Flags.C, false)
        return 0
    }

    private CLD = (): number => {
        this.setFlag(Flags.D, false)
        return 0
    }

    private CLI = (): number => {
        this.setFlag(Flags.I, false)
        return 0
    }

    private CLV = (): number => {
        this.setFlag(Flags.V, false)
        return 0
    }

    private CMP = (): number => {
        const m = this.read(this.addr)

        this.setFlag(Flags.Z, this.a === m)
        this.setFlag(Flags.C, this.a >= m)
        this.setFlag(Flags.N, (((this.a - m) & 0xFF) & 0x80) !== 0)
        return 0
    }

    private CPX = (): number => {
        const m = this.read(this.addr)

        this.setFlag(Flags.Z, this.x === m)
        this.setFlag(Flags.C, this.x >= m)
        this.setFlag(Flags.N, (((this.x - m) & 0xFF) & 0x80) !== 0)
        return 0
    }

    private CPY = (): number => {
        const m = this.read(this.addr)

        this.setFlag(Flags.Z, this.y === m)
        this.setFlag(Flags.C, this.y >= m)
        this.setFlag(Flags.N, (((this.y - m) & 0xFF) & 0x80) !== 0)
        return 0
    }

    private DEC = (): number => {
        const m = this.read(this.addr)
        const result = (m - 1) & 0x00FF

        this.write(this.addr, result)
        this.setFlag(Flags.Z, result === 0)
        this.setFlag(Flags.N, (result & 0x80) !== 0)
        return 0
    }

    private DEX = (): number => {
        this.x = (this.x - 1) & 0x00FF

        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) !== 0)
        return 0
    }

    private DEY = (): number => {
        this.y = (this.y - 1) & 0x00FF

        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) !== 0)
        return 0
    }

    private EOR = (): number => {
        const m = this.read(this.addr)

        this.a = this.a ^ m
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private INC = (): number => {
        const m = this.read(this.addr)
        const result = (m + 1) & 0xFF

        this.write(this.addr, result)
        this.setFlag(Flags.Z, result == 0x00)
        this.setFlag(Flags.N, (result & 0x80) !== 0)
        return 0
    }

    private INX = (): number => {
        this.x = (this.x + 1) & 0xFF

        this.setFlag(Flags.Z, this.x == 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) !== 0)
        return 0
    }

    private INY = (): number => {
        this.y = (this.y + 1) & 0xFF

        this.setFlag(Flags.Z, this.y == 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) !== 0)
        return 0
    }

    private JMP = (): number => {
        this.pc = this.addr
        return 0
    }

    private JSR = (): number => {
        this.pc = this.pc - 1
        this.write(0x100 + this.stkp, (this.pc >> 8) & 0x00FF)
        this.write(0x100 + this.stkp - 1, this.pc & 0x00FF)
        this.stkp = this.stkp - 2
        this.pc = this.addr
        return 0
    }

    private LDA = (): number => {
        this.a = this.read(this.addr)
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private LDX = (): number => {
        this.x = this.read(this.addr)
        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) !== 0)
        return 0
    }

    private LDY = (): number => {
        this.y = this.read(this.addr)
        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) !== 0)
        return 0
    }

    private LSR = (): number => {
        const implied: boolean = (this.currentInstruction.addressing === 'ACC')
        const data: number = (implied ? this.a : this.read(this.addr)) & 0xFF
        const result: number = (data >> 1) & 0xFF

        this.setFlag(Flags.C, (data & 0x01) !== 0)
        this.setFlag(Flags.N, false)
        this.setFlag(Flags.Z, result === 0)
        if (implied === true) {
            this.a = result
        } else {
            this.write(this.addr, result)
        }
        return 0
    }

    private NOP = (): number => {
        return 0
    }

    private ORA = (): number => {
        const m = this.read(this.addr)

        this.a = this.a | m

        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private PHA = (): number => {
        this.write(0x100 + this.stkp, this.a)
        this.stkp = this.stkp - 1 & 0xFF
        return 0
    }

    private PHP = (): number => {
        this.write(0x100 + this.stkp, this.status | 0x30)
        this.stkp = (this.stkp - 1) & 0xFF
        return 0
    }

    private PLA = (): number => {
        this.stkp = this.stkp + 1
        this.a = this.read(0x100 + this.stkp)
        this.setFlag(Flags.Z, this.a === 0)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private PLP = (): number => { // break flag set and unused flag set
        this.stkp = (this.stkp + 1) & 0xFF
        this.status = this.read(0x100 + this.stkp)
        this.setFlag(Flags.B, false)
        this.setFlag(Flags.A, true)
        return 0
    }

    private ROL = (): number => {
        const m = this.currentInstruction.addressing === 'ACC' ? this.a : this.read(this.addr)
        const result = m << 1 | this.getFlag(Flags.C)

        this.setFlag(Flags.C, (result & 0x0100) != 0) 
        this.setFlag(Flags.Z, (result & 0x00FF) === 0)
        this.setFlag(Flags.N, (result & 0x80) !== 0)
        if (this.currentInstruction.addressing === 'ACC') {
            this.a = result & 0x00FF
        }
        else {
            this.write(this.addr, result & 0x00FF)
        }
        return 0
    }

    private ROR = (): number => {
        const m = this.currentInstruction.addressing === 'ACC' ? this.a : this.read(this.addr)
        const result = (m >> 1) | (this.getFlag(Flags.C) << 7)
    
        this.setFlag(Flags.C, (m & 0x01) !== 0)
        this.setFlag(Flags.Z, (result & 0x00FF) === 0)
        this.setFlag(Flags.N, (result & 0x80) !== 0)    
        if (this.currentInstruction.addressing === 'ACC') {
            this.a = result & 0x00FF
        } else {
            this.write(this.addr, result & 0x00FF)
        }
        return 0
    }

    private RTI = (): number => { // to check back
        const lo = this.read(0x100 + this.stkp + 2)
        const hi = this.read(0x100 + this.stkp + 3)

        this.status = this.read(0x100 + this.stkp + 1)
        this.setFlag(Flags.B, true)
        this.pc = (hi << 8) | lo;
        this.stkp = this.stkp + 3
        return 0
    }

    private RTS = (): number => {
        const lo = this.read(0x100 + this.stkp + 1)
        const hi = this.read(0x100 + this.stkp + 2)

        this.pc = ((hi << 8) | lo) + 1
        this.stkp = (this.stkp + 2) & 0xFF
        return 0
    }

    private SBC = (): number => {
        const m = this.read(this.addr);
        const carry = this.getFlag(Flags.C) ? 1 : 0;
        const decimalMode = this.getFlag(Flags.D);
        let result: number;
        
        if (decimalMode) {
            let lowNibble = (this.a & 0x0F) - (m & 0x0F) - (1 - carry);
            let highNibble = (this.a >> 4) - (m >> 4);
    
            if (lowNibble < 0) {
                lowNibble -= 6;
                highNibble--;
            }
    
            if (highNibble < 0) {
                highNibble -= 6;
            }
    
            result = (highNibble << 4) | (lowNibble & 0x0F);
        } else {
            result = this.a - m - (1 - carry);
        }
    
        // Set Zero flag (Z)
        this.setFlag(Flags.Z, (result & 0x00FF) === 0);
    
        // Set Negative flag (N)
        this.setFlag(Flags.N, (result & 0x80) !== 0);
    
        // Set Overflow flag (V)
        this.setFlag(Flags.V, ((this.a ^ result) & (this.a ^ m) & 0x80) !== 0);
    
        // Set Carry flag (C)
        this.setFlag(Flags.C, result >= 0);
    
        this.a = result & 0xFF;
        return 0;
    }

    private SEC = (): number => {
        this.setFlag(Flags.C, true)
        return 0
    }

    private SED = (): number => {
        this.setFlag(Flags.D, true)
        return 0
    }

    private SEI = (): number => {
        this.setFlag(Flags.I, true)
        return 0
    }

    private STA = (): number => {
        this.write(this.addr, this.a)
        return 0
    }

    private STX = (): number => {
        this.write(this.addr, this.x)
        return 0
    }

    private STY = (): number => {
        this.write(this.addr, this.y)
        return 0
    }

    private TAX = (): number => {
        this.x = this.a
        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) !== 0)
        return 0
    }

    private TAY = (): number => {
        this.y = this.a
        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) !== 0)
        return 0
    }

    private TSX = (): number => {
        this.x = this.stkp
        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) !== 0)
        return 0
    }

    private TXA = (): number => {
        this.a = this.x
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private TXS = (): number => {
        this.stkp = this.x
        return 0
    }

    private TYA = (): number => {
        this.a = this.y
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) !== 0)
        return 0
    }

    private ILL = (): number => {
        return 0
    }

    /**
     * Debug functions
     */

    private getProcessorStatus(start: number) {
        const info: Array<DebugInfo> = []
        let pc = start

        if (this.debug === false) {
            info.push(this.disass2(start).info)
        } else {
            while (pc < start + 16) {
                const data = this.disass2(pc)
                pc = data.pc
                info.push(data.info)
            }
        }
        return {
            info,
            registers: {
                a: this.a,
                x: this.x,
                y: this.y,
                stkp: this.stkp,
                status: {
                    n: this.getFlag(Flags.N),
                    v: this.getFlag(Flags.V),
                    d: this.getFlag(Flags.D),
                    i: this.getFlag(Flags.I),
                    z: this.getFlag(Flags.Z),
                    c: this.getFlag(Flags.C),
                }
            }
        }
    }

    private disass2(pc: number) {
        const info: DebugInfo = {
            address: pc,
            instruction: [],
            disassembly: { operand: 0, addressingMode: 'IMP', instruction: '???' },
        }
        const opcode = this.read(pc)
        const op = decode(opcode)

        info.instruction.push(opcode & 0xFF)
        info.disassembly.instruction = op.instruction
        info.disassembly.addressingMode = op.addressing
        pc++
        if (info.disassembly.instruction === 'BRK') {
            info.disassembly.operand = (this.read(0xFFFF) << 8) | this.read(0xFFFE)
        }
        if (info.disassembly.addressingMode === 'IMM') {
            info.instruction.push(this.read(pc))
            info.disassembly.operand = info.instruction[1]
            pc++
        } else if (
            info.disassembly.addressingMode === 'ABS' ||
            info.disassembly.addressingMode === 'ABX' ||
            info.disassembly.addressingMode === 'ABY' ||
            info.disassembly.addressingMode === 'IND'
        ) {
            info.instruction.push(this.read(pc))
            pc++
            info.instruction.push(this.read(pc))
            pc++
            info.disassembly.operand = ((info.instruction[2] << 8) | info.instruction[1]) & 0xFFFF
        } else if (
            info.disassembly.addressingMode === 'INX' ||
            info.disassembly.addressingMode === 'INY' ||
            info.disassembly.addressingMode === 'ZPI' ||
            info.disassembly.addressingMode === 'ZPX' ||
            info.disassembly.addressingMode === 'ZPY'
        ) {
            info.instruction.push(this.read(pc))
            pc++
            info.disassembly.operand = info.instruction[1]
        } else if (info.disassembly.addressingMode === 'REL') {
            info.instruction.push(this.read(pc))
            pc++
            const offset = (info.instruction[1] > 127) ? info.instruction[1] - 256 : info.instruction[1]
            info.disassembly.operand = pc + offset
        }
        return {
            info,
            pc,
        }
    }
}

export default mos6502
