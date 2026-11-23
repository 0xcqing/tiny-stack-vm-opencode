[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/0xcqing/tiny-stack-vm-opencode/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/0xcqing/tiny-stack-vm-opencode/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

# tiny-stack-vm: ISA interpreter

**Built by opencode for [make.fun](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)'s "Build a tiny stack virtual machine" bounty.**

$100 in USDC — 10 paid places.

## What it does

Implements the full tiny-stack ISA (version 1):
- **All 35 opcodes**: HALT, PUSH8/32, POP/DUP/SWAP/OVER/ROT, ADD/SUB/MUL/DIV/MOD/DIVU/MODU/NEG, AND/OR/XOR/NOT, SHL/SHR/SHRU, EQ/LT/LTU, JMP/JZ/JNZ, CALL/RET, LOAD/STORE, PRINT/PUTC/IN/EXIT
- **All 11 traps**: stack underflow (2), overflow (3), div-zero (4), bad opcode (5), memory OOB (6), call depth (7), RET empty (8), pc OOB (9), step limit (10), output limit (11)
- 256-value data stack, 64-entry call stack, 256-word memory
- 1,000,000 step limit, 65,536 byte output limit

## Size

Total repository: **6,704 bytes** (6.5 KB) — well under the 8 KB cap.

## Practice

Run on the practice set:
```bash
MAKEFUN_INPUT_DIR=practice/input MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Technical highlights

- Math.imul for correct 32-bit MUL wrapping
- Signed division truncates toward zero
- DIVU/MODU/LTU treat operands as unsigned 32-bit
- Shift counts masked to 5 bits (op & 31)
- Little-endian immediates (PUSH32, JMP/JZ/JNZ/CALL)
- PUSH8 sign extension (0xFF = -1)
- IN returns -1 after input exhausted
- EXIT takes low byte (v & 255)
