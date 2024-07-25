import Flags from "./types/flags"
import Instruction, { AddressingModesMap, InstructionsMap } from "./types/instruction"

class mos6502 {
    private a: number = 0x00
    private x: number = 0x00
    private y: number = 0x00
    private pc: number = 0x00 // 2 bytes, contains the next address of the program  
    private stkp: number = 0x00
    private status: number = 0x00

    private addressingModes: AddressingModesMap
    private instructionsMap: InstructionsMap


    private addr: number = 0x00

    private currentInstruction: Instruction = { name: '???', mode: this.IMP, op: this.ABS, cycles: 2 }
    
    // looking for a way to remove the matrix from this class, it takes too much space and it makes me want
    // to add this project to my pile of shame
    // 51 out of 57 instructions

    constructor() {
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
            TXS: t.TXS, TYA: t.TYA,
        }
    }

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



    private write(addr: number, value: number) {

    }

    private read(addr: number): number {
        return 0
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
     * Used by branching instruction. A signed one bit offset is used to indicate the jump location.
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

    private STA(address) {
        this.write(address, this.a)
    }

    private STX(address) {
        this.write(address, this.x)
    }


    private STY(address) {
        this.write(address, this.y)
    }
}

export default mos6502
