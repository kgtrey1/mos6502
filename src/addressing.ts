export type AddressingModes =
    'ACC' | 'IMP' | 'IMM' | 'ABS' | 'ABX' | 'ABY' | 'IND' | 'INX' | 'INY' | 'REL' | 'ZPI' | 'ZPX' | 'ZPY'

export type AddressingModesMap = { [code in AddressingModes ] : () => number }
