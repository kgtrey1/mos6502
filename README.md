# 6502

This emulator simulates a MOS6502 CPU. It is written in TypeScript and should work in any environment.

<hr>

- Support decimal mode

- Small debugger

- Passes Klaus Dormann's test suite



## Installation


```

npm i 6502 --save

```


### or


```

yarn add 6502

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

## Methods


## CONTRIBUTING


If you want to contribute, feel free to open a pull request and I will review it.



## License


This project is licensed under the MIT License - see the [LICENSE.md]() file for details.


## Author


Made with ❤️ by [kgtrey1](https://github.com/kgtrey1).