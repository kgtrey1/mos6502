# mos6502

[![Coverage Status](https://coveralls.io/repos/github/kgtrey1/kes/badge.svg?branch=master)](https://coveralls.io/github/kgtrey1/kes?branch=master)  ![NPM Version](https://img.shields.io/npm/v/mos6502)    ![Static Badge](https://img.shields.io/badge/license-mit-blue)

<hr>

## Description


A simple emulator for the MOS6502 CPU, written entirely in TypeScript and designed for compatibility. This emulator can be used in any JavaScript environment making it perfect for retro game development, or just exploring the classic 6502 architecture.


## Features


- Fully written in TypeScript
- Emulates the full range of MOS6502 instructions.
- Implements the 6502's decimal mode.
- Passes Klaus Dormann's functional test suite, ensuring reliability and correctness.


## Installation


```

npm i mos6502 --save

```


### or


```

yarn add mos6502

```


## Example
#### Load a program from a file into memory and execute it

```jsx
import mos6502 from '6502';

const cpu = new most6502();
const RAM = new Uint8Array(0xFFFF);

/* Load your program (in this case, from a file). */
RAM.set(readFileSync('path/to/your/program'), 0);

/* Set your reset vector ($8000 for this example). */
RAM[0xFFFC] = 0x00;
RAM[0xFFFD] = 0x80;

function read(address: number) {
    return RAM[address];
}

function write(address: number, value: number) {
    RAM[address] = value;
}

/* Simulate a clock cycle */
cpu.emulate();
```

## What's Next

While the emulator currently meets my needs, I have several enhancements planned for the near future:

- **Codebase Review**: Perform a thorough review of the codebase to ensure all naming conventions are clean and consistent.
- **Debugger Enhancements**: Improve the debugger functionality and streamline the way information is passed.
- **Interactive Shell**: Develop a mini shell for the debugger to allow user input and commands.
- **Breakpoint Commands**:
  - **Set Breakpoints**: Implement commands like `b $1710` to set breakpoints at specific addresses.
  - **Continue Execution**: Add the `c` command to continue execution until the next breakpoint.
- **Single-Step Execution**: Introduce the `s` command to execute the next instruction step-by-step.
- **Memory Analysis**: Add commands like `mem $1710` to inspect and analyze memory contents at specified addresses.

## CONTRIBUTING


If you want to contribute, feel free to open a pull request and I will review it.



## License


This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/kgtrey1/kes/blob/master/LICENSE) file for details.


## Author


Made with ❤️ by [kgtrey1](https://github.com/kgtrey1).