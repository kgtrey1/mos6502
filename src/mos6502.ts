import Flags from "./types/flags"
import Instruction, { AddressingModesMap, InstructionsMap, Test, decode } from "./types/instruction"

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
    private currentInstruction: Test = { instruction: '???', addressing: 'IMP', cycles: 2 }
    private cycle: number = 0
    private read: (address: number) => number
    private write: (address: number, value: number) => void

    constructor(read: (address: number) => number, write: (address: number, value: number) => void) {
        const t = this

        this.addressingModes = {
            IMP: t.IMP, IMM: t.IMM, ABS: t.ABS, ABX: t.ABX, ABY: t.ABY, IND: t.IND,
            INX: t.IX , INY: t.IY , REL: t.REL, ZPI: t.ZP , ZPX: t.ZPX, ZPY: t.ZPY
        }
        this.instructionsMap = {
            ADC: t.ADC, AND: t.AND, ASL: t.ASL, BCC: t.BCC, BCS: t.BCS, BEQ: t.BEQ, 
            BIT: t.BIT, BMI: t.BMI, BNE: t.BNE, BPL: t.BPL, BRK: t.BRK, BVC: t.BVC,
            BVS: t.BVS, CLC: t.CLC, CLD: t.CLD, CLI: t.CLI, CLV: t.CLV, CMP: t.CMP,
            CPX: t.CPX, CPY: t.CPY, DEC: t.DEC, DEX: t.DEX, DEY: t.DEY, EOR: t.EOR,
            INC: t.INC, INX: t.INX, INY: t.INY, JMP: t.JMP, JSR: t.JSR, LDA: t.LDA,
            LDX: t.LDX, LDY: t.LDY, LSR: t.LSR, NOP: t.NOP, ORA: t.ORA, PHA: t.PHA,
            PHP: t.PHP, PLA: t.PLA, PLP: t.PLP, ROL: t.ROL, ROR: t.ROR, RTI: t.RTI,
            RTS: t.RTS, SBC: t.SBC, SEC: t.SEC, SED: t.SED, SEI: t.SEI, STA: t.STA,
            STX: t.STX, STY: t.STY, TAX: t.TAX, TAY: t.TAY, TSX: t.TSX, TXA: t.TXA,
            TXS: t.TXS, TYA: t.TYA, '???': t.ILL,
        }
        this.read = read
        this.write = write
    }

    public getState() {
        return {
            instruction: this.currentInstruction,
            a: this.a,
            x: this.x,
            y: this.y,
            pc: this.pc,
            stkp: this.stkp,
            status: this.status,
        }
    }

    public emulate(): number {
        if (this.cycle === 0) {
            this.pc = this.pc + 1
            this.currentInstruction = decode(this.read(this.pc) & 0xFF)

            this.cycle = this.currentInstruction.cycles
            this.cycle = this.cycle + this.addressingModes[this.currentInstruction.addressing]()
            this.cycle = this.cycle + this.instructionsMap[this.currentInstruction.instruction]()
        }
        this.cycle = this.cycle - 1
        return this.cycle
    }

    public getFlag (flag: Flags) {
      const mask = 1 << flag;

      return (this.status & mask) !== 0 ? 1 : 0
  }

    public setFlag(flag: Flags, value: boolean) {
        const mask = (1 << flag) & 0xFF;

        this.status = (value) ? this.status | mask : this.status & ~mask
        return
    }


    /* Addressing modes */


    /**
     * Implied Addressing mode.
     * 
     * No address operand, we do nothing
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IMP(): number {
        return 0
    }

    /**
     * Immediate Addressing mode.
     * 
     * Use the next byte as a value
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IMM(): number {
        this.pc = (this.pc + 1) & 0xFFFF
        this.addr = this.pc
        return 0
    }

    /**
     * Absolute Addressing mode.
     * 
     * The address of the value that the instruction will use is located in the next to bytes.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private ABS(): number {
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
    private ABX(): number {
        const low = this.read(this.pc)
        const high = this.read((this.pc + 1) & 0xFFFF)

        this.pc = (this.pc + 2) & 0xFFFF
        this.addr = (((high << 8) | low) + this.x) & 0xFFFF
        return (this.addr & 0xFF00) === (high << 8) ? 0 : 1
    }

    /**
     * Absolute with Y index Addressing mode.
     * 
     * The address of the value that the instruction will use is located in the next to bytes.
     * @returns {number} 1 if a page is crossed, else 0.
     */
    private ABY(): number {
        const low = this.read(this.pc)
        const high = this.read((this.pc + 1) & 0xFFFF)

        this.pc = (this.pc + 2) & 0xFFFF
        this.addr = (((high << 8) | low) + this.y) & 0xFFFF
        return (this.addr & 0xFF00) === (high << 8) ? 0 : 1
    }

    /**
     * Indirect Addressing mode.
     * 
     * Read two bytes to form a 16 bits address. These two bytes are located
     * at the address that we get after reading the next two bytes.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IND(): number {
        const low = this.read(this.pc)
        const high = this.read((this.pc + 1) & 0xFFFF)
        const address = (high << 8) | low;

        this.pc = (this.pc + 2) & 0xFFFF
        this.addr = this.read(address) | (this.read(address + 1) << 8);        
        return 0
    }

    /**
     * Indirect with X index Addressing mode.
     * 
     * Indirect with an offset equal to X.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private IX(): number {
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
    private IY(): number {
        const loc = this.read(this.pc);

        this.pc = (this.pc + 1) & 0xFFFF
        this.addr = (this.read((loc + this.y + 1) & 0xFF) << 8) | this.read(loc + this.y & 0xFF)   
        return 0
    }

    /**
     * Relative Addressing mode.
     *
     * Used by branching instruction. A signed one byte offset is used to indicate the jump location.
     * @returns 
     */
    private REL(): number {
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
    private ZP(): number {
        const low = this.read(this.pc)

        this.addr = low & 0x00FF
        this.pc = this.pc + 1
        return 0
    }

    /**
     * Zero Page with X index Addressing mode.
     * 
     * We assume that the value is located on page 0, at the offset indicated by the next + x byte.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private ZPX(): number {
        const low = this.read((this.pc + this.x) & 0xFFFF)

        this.addr = low & 0x00FF
        this.pc = this.pc + 1
        return 0
    }

    /**
     * Zero Page with X index Addressing mode.
     * 
     * We assume that the value is located on page 0, at the offset indicated by the next + y byte.
     * @returns {number} 0, this addressing mode does not require additionnal clock cycles.
     */
    private ZPY(): number {
        const low = this.read((this.pc + this.y) & 0xFFFF)

        this.addr = low & 0x00FF
        this.pc = this.pc + 1
        return 0
    }


    /**
     * Instructions
     * reference: https://www.nesdev.org/obelisk-6502-guide/reference.html
     */


    private ADC() {
        const m = this.read(this.addr)
        const result = this.a + m + this.getFlag(Flags.C);

	    this.setFlag(Flags.Z, (result & 0x00FF) === 0);
		this.setFlag(Flags.V, ((this.a ^ m) & (this.a ^ result) & 0x80) !== 0)
	    this.setFlag(Flags.N, (result & 0x80) === 1);
        this.setFlag(Flags.C, result > 0xFF);
	    this.a = result & 0x00FF;
        return 0
    }

    private AND() {
        const m = this.read(this.addr)

        this.a = this.a & m
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private ASL() {
        const implied: boolean = (this.currentInstruction.addressing === 'IMP')
        const data: number = (implied ? this.a : this.read(this.addr))
        const result: number = (data << 1) & 0xFFFF

        this.setFlag(Flags.C, (result & 0xFF00) > 0x00)
        this.setFlag(Flags.N, (result & 0x80) === 0x01)
        this.setFlag(Flags.Z, (result & 0xFF) === 0x00)

        if (implied === true) {
            this.a = result & 0x00FF
        } else {
            this.write(this.addr, result & 0x00FF)
        }
        return 0
    }

    private BCC() {
        if (this.getFlag(Flags.C) === 1) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BCS() {
        if (this.getFlag(Flags.C) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BEQ() {
        if (this.getFlag(Flags.Z) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BIT() {
        const m = this.read(this.addr)
        const result = this.a & m

        this.setFlag(Flags.Z, (result === 0x00))
        this.setFlag(Flags.V, (m & 0x40) === 1)
        this.setFlag(Flags.N, (m & 0x80) === 1)
        return 0
    }

    private BMI() {
        if (this.getFlag(Flags.N) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BNE() {
        if (this.getFlag(Flags.Z) === 1) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BPL() {
        if (this.getFlag(Flags.N) === 1) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
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

    private BVC() {
        if (this.getFlag(Flags.V) === 1) {
            return 0
        }

        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private BVS() {
        if (this.getFlag(Flags.V) === 0) {
            return 0
        }
        const oldAddress = this.pc

        this.pc  = (oldAddress + this.addr) & 0xFFFF
        return ((this.pc & 0xFF00) !== (oldAddress & 0xFF00)) ? 2 : 1
    }

    private CLC() {
        this.setFlag(Flags.C, false)
        return 0
    }

    private CLD() {
        this.setFlag(Flags.D, false)
        return 0
    }

    private CLI() {
        this.setFlag(Flags.I, false)
        return 0
    }

    private CLV() {
        this.setFlag(Flags.V, false)
        return 0
    }

    private CMP() {
        const m = this.read(this.addr)

        this.setFlag(Flags.Z, this.a === m)
        this.setFlag(Flags.C, this.a >= m)
        this.setFlag(Flags.N, (((this.a - m) & 0xFF) & 0x80) === 1)
        return 0
    }

    private CPX() {
        const m = this.read(this.addr)

        this.setFlag(Flags.Z, this.x === m)
        this.setFlag(Flags.C, this.x >= m)
        this.setFlag(Flags.N, (((this.x - m) & 0xFF) & 0x80) === 1)
        return 0
    }

    private CPY() {
        const m = this.read(this.addr)

        this.setFlag(Flags.Z, this.y === m)
        this.setFlag(Flags.C, this.y >= m)
        this.setFlag(Flags.N, (((this.y - m) & 0xFF) & 0x80) === 1)
        return 0
    }

    private DEC() {
        const m = this.read(this.addr)
        const result = (m - 1) & 0x00FF

        this.write(this.addr, result)
        this.setFlag(Flags.Z, result === 0)
        this.setFlag(Flags.N, (result & 0x80) === 1)
        return 0
    }

    private DEX() {
        this.x = (this.x - 1) & 0x00FF

        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) === 1)
        return 0
    }

    private DEY() {
        this.y = (this.y - 1) & 0x00FF

        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) === 1)
        return 0
    }

    private EOR() {
        const m = this.read(this.addr)

        this.a = this.a ^ m
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private INC() {
        const m = this.read(this.addr)
        const result = (m + 1) & 0xFF

        this.write(this.addr, result)
        this.setFlag(Flags.Z, result == 0x00)
        this.setFlag(Flags.N, (result & 0x80) === 1)
        return 0
    }

    private INX() {
        this.x = (this.x + 1) & 0xFF

        this.setFlag(Flags.Z, this.x == 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) === 1)
        return 0
    }

    private INY() {
        this.y = (this.y + 1) & 0xFF

        this.setFlag(Flags.Z, this.y == 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) === 1)
        return 0
    }

    private JMP() {
        this.pc = this.addr
        return 0
    }

    private JSR() {
        this.write(this.stkp, ((this.pc - 1) >> 8) & 0x00FF)
        this.write(this.stkp - 1, (this.pc - 1) & 0x00FF)
        this.stkp = this.stkp - 2
        this.pc = this.addr
        return 0
    }

    private LDA() {
        this.a = this.read(this.addr)
        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private LDX() {
        this.x = this.read(this.addr)
        this.setFlag(Flags.Z, this.x === 0x00)
        this.setFlag(Flags.N, (this.x & 0x80) === 1)
        return 0
    }

    private LDY() {
        this.y = this.read(this.addr)

        this.setFlag(Flags.Z, this.y === 0x00)
        this.setFlag(Flags.N, (this.y & 0x80) === 1)
        return 0
    }

    private LSR() {
        const implied: boolean = (this.currentInstruction.addressing === 'IMP')
        const data: number = (implied ? this.a : this.read(this.addr)) & 0xFF
        const result: number = (data >> 1) & 0xFF

        this.setFlag(Flags.C, (data & 0x01) === 1)
        this.setFlag(Flags.N, (result & 0x80) === 1)
        this.setFlag(Flags.Z, result === 0)
        if (implied === true) {
            this.a = result
        } else {
            this.write(this.addr, result)
        }
        return 0
    }

    private NOP() {
        return 0
    }

    private ORA() {
        const m = this.read(this.addr)

        this.a = this.a | m

        this.setFlag(Flags.Z, this.a === 0x00)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private PHA() {
        this.write(this.stkp, this.a)
        this.stkp = this.stkp - 1
        return 0
    }

    private PHP() {
        this.write(this.stkp, this.status)
        this.stkp = this.stkp - 1
        return 0
    }

    private PLA() {
        this.stkp = this.stkp + 1
        this.a = this.read(this.stkp)
        this.setFlag(Flags.Z, this.a === 0)
        this.setFlag(Flags.N, (this.a & 0x80) === 1)
        return 0
    }

    private PLP() {
        this.stkp = this.stkp + 1
        this.status = this.read(this.stkp)
        return 0
    }

    private ROL() {
        const m = this.currentInstruction.addressing === 'IMP' ? this.a : this.read(this.addr)
        const result = m << 1 | this.getFlag(Flags.C)

        this.setFlag(Flags.C, (result & 0x0100) != 0) 
        this.setFlag(Flags.Z, (result & 0x00FF) === 0)
        this.setFlag(Flags.N, (result & 0x80) !== 0)
        if (this.currentInstruction.addressing === 'IMP') {
            this.a = result & 0x00FF
        }
        else {
            this.write(this.addr, result & 0x00FF)
        }
        return 0
    }

    private ROR() {
        const m = this.currentInstruction.addressing === 'IMP' ? this.a : this.read(this.addr)
        const result = (m >> 1) | (this.getFlag(Flags.C) << 7)
    
        this.setFlag(Flags.C, (m & 0x01) !== 0)
        this.setFlag(Flags.Z, (result & 0x00FF) === 0)
        this.setFlag(Flags.N, (result & 0x80) !== 0)    
        if (this.currentInstruction.addressing === 'IMP') {
            this.a = result & 0x00FF
        } else {
            this.write(this.addr, result & 0x00FF)
        }
        return 0
    }

    private RTI() {
        const lo = this.read(this.stkp + 1)
        const hi = this.read(this.stkp + 2)

        this.status = this.read(this.stkp)
        this.setFlag(Flags.B, true)
        this.pc = (hi << 8) | lo;
        this.stkp = this.stkp + 3
        return 0
    }

    private RTS() {
        const lo = this.read(this.stkp + 1)
        const hi = this.read(this.stkp + 2)

        this.pc = ((hi << 8) | lo) + 1
        this.stkp = this.stkp + 3
        return 0
    }

    private SBC() {
        const m = this.read(this.addr)
        const result = this.a - m - (1 - this.getFlag(Flags.C))
    
        this.setFlag(Flags.Z, (result & 0x00FF) === 0)
        this.setFlag(Flags.N, (result & 0x80) !== 0)
        this.setFlag(Flags.V, (((this.a ^ m) & (this.a ^ result)) & 0x80) !== 0)
        this.setFlag(Flags.C, result >= 0)   
        this.a = result & 0xFF
        return 0
    }

    private SEC() {
        this.setFlag(Flags.C, true)
        return 0
    }

    private SED() {
        this.setFlag(Flags.D, true)
        return 0
    }

    private SEI() {
        this.setFlag(Flags.I, true)
        return 0
    }

    private STA() {
        this.write(this.addr, this.a)
        return 0
    }

    private STX() {
        this.write(this.addr, this.x)
        return 0
    }

    private STY() {
        this.write(this.addr, this.y)
        return 0
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
        return 0
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

    private ILL() {
        return 0
    }
}

export default mos6502
