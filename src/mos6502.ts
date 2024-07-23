class mos6502 {
    private a: number = 0x00
    private x: number = 0x00
    private y: number = 0x00
    private pc: number = 0x00 // 2 bytes
    private stkp: number = 0x00
    private status: number = 0x00
}

export default mos6502
