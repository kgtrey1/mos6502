import { close, openSync, readFileSync, writeSync } from "fs"
import path from "path"
import mos6502 from "../src/mos6502"
import { formatDisassembly, formatRegisters, hex } from "../src/formatter"

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
        const fd = openSync(path.join(__dirname, 'trace/trace.txt'), 'w')
        RAM.set(readFileSync(path.join(__dirname, 'bin/6502_functional_test.bin')), 0)
        
        RAM[0xFFFC] = 0x00;
        RAM[0xFFFD] = 0x04;

        const cpu = new mos6502(read, write, true)
        let currentInstruction = 1

        /**
         * This test should be complete under 1 minute.
         * If it's not the case, the CPU has been trapped.
         */
        const timeout = setTimeout(() => {
            currentInstruction = 100001
        }, 60 * 1000)

        while (currentInstruction < 99999) {
            const data = cpu.emulate()

            if (data.processorStatus) {
                writeSync(fd,
                    formatDisassembly(data.processorStatus.info[0]) +
                    formatRegisters(data.processorStatus.registers) +
                    (data.cycle + 1) +
                    '\n'
                )
                if (data.processorStatus.info[0].disassembly.instruction === 'BRK') {
                    writeSync(fd,
                        `* BRK at ${hex(data.processorStatus.info[0].address, 4)} => ${hex(data.processorStatus.info[0].disassembly.operand, 4)}\n`
                    )
                }
                currentInstruction += 1
            }
        }
        clearTimeout(timeout)
        close(fd)
        expect(readFileSync(path.join(__dirname, 'trace/trace.txt')))
        .toEqual(readFileSync(path.join(__dirname, 'trace/valid.txt')));
    })
})