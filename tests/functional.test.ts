import { cp, readFileSync } from "fs"
import path from "path"
import mos6502 from "../src/mos6502"

describe('Functional tests - Klaus Dormann test suite', () => {
    const RAM = new Uint8Array(0x10000)

    RAM.set(readFileSync(path.join(__dirname, 'bin/6502_functional_test.bin')), 0)
    RAM[0xFFFC] = 0x00;
    RAM[0xFFFD] = 0x04;

    function read(address: number) {
        return RAM[address]
    }

    function write(address: number, value: number) {
        RAM[address] = value
    }

    test('Run functional test suite', () => {
        const cpu = new mos6502(read, write)
        let complete = false
        let flag = false

        /**
         * This test should be complete under 1 minute.
         * If it's not the case, the CPU has been trapped.
         */
        const timeout = setTimeout(() => {
            complete = true
        }, 60 * 1000)

        while (complete === false) {
            const data = cpu.emulate()

            if (
                data.processorStatus &&
                data.processorStatus.info[0].disassembly.instruction === 'JMP' &&
                data.processorStatus.info[0].address === 0x3469
            ) {
                flag = complete = true
            }
        }
        clearTimeout(timeout)
        expect(flag).toBeTruthy()
    })

    test('Illegal opcode', () => {
        RAM[0xFFFC] = 0xFF;
        RAM[0xFFFD] = 0x00;
        RAM[0xFF00] = 0xC2;

        const cpu = new mos6502(read, write)

        const data = cpu.emulate()
        expect(data.processorStatus?.info[0].disassembly.instruction).toBe('???')
    })
})