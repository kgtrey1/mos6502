interface Instruction {
    name: string
    op: () => void
    mode: () => void
    cycles: number
}

export default Instruction
