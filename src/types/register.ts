interface RegistersInfo {
    a: number
    x: number
    y: number
    stkp: number
    status: {
        n: 1 | 0
        v: 1 | 0
        d: 1 | 0
        i: 1 | 0
        z: 1 | 0
        c: 1 | 0
    }
}

export default RegistersInfo
