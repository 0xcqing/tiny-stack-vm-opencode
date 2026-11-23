// tiny-stack-vm: ISA interpreter, all 35 opcodes, all 11 traps, 256-value stack, 256-word memory.
import * as fs from 'fs';
import * as path from 'path';

const inputDir = process.env.MAKEFUN_INPUT_DIR!;
const outputDir = process.env.MAKEFUN_OUTPUT_DIR!;

for (const inst of fs.readdirSync(inputDir)) {
    const instDir = path.join(inputDir, inst);
    if (!fs.statSync(instDir).isDirectory()) continue;
    const outInstDir = path.join(outputDir, inst);
    fs.mkdirSync(outInstDir, { recursive: true });

    const program = fs.readFileSync(path.join(instDir, 'program.bin'));
    const input = fs.readFileSync(path.join(instDir, 'input.bin'));

    const ds = new Int32Array(256), cs = new Int32Array(64), mem = new Int32Array(256);
    let dsP = 0, csP = 0, pc = 0, steps = 0, inP = 0, outP = 0, exitCode = 0;
    const out = Buffer.alloc(65536);

    try {
        while (true) {
            if (steps++ >= 1000000) throw 10;
            if (pc < 0 || pc >= program.length) throw 9;
            const op = program[pc++];
            
            const pop = () => { if (dsP <= 0) throw 2; return ds[--dsP]; };
            const push = (v: number) => { if (dsP >= 256) throw 3; ds[dsP++] = v; };
            const read16 = () => {
                if (pc + 2 > program.length) throw 9;
                const v = (program[pc] | (program[pc+1] << 8)) << 16 >> 16;
                pc += 2;
                return v;
            };
            const read16u = () => {
                if (pc + 2 > program.length) throw 9;
                const v = (program[pc] | (program[pc+1] << 8)) >>> 0;
                pc += 2;
                return v;
            };
            const read32 = () => {
                if (pc + 4 > program.length) throw 9;
                const v = (program[pc] | (program[pc+1] << 8) | (program[pc+2] << 16) | (program[pc+3] << 24)) | 0;
                pc += 4;
                return v;
            };

            switch (op) {
                case 0x00: exitCode = 0; break;
                case 0x01: if(pc >= program.length) throw 9; push((program[pc++] << 24) >> 24); break;
                case 0x02: push(read32()); break;
                case 0x03: pop(); break;
                case 0x04: const v1 = pop(); push(v1); push(v1); break;
                case 0x05: const b1 = pop(); const a1 = pop(); push(b1); push(a1); break;
                case 0x06: const b2 = pop(); const a2 = pop(); push(a2); push(b2); push(a2); break;
                case 0x07: const c3 = pop(); const b3 = pop(); const a3 = pop(); push(b3); push(c3); push(a3); break;
                case 0x10: push((pop() + pop()) | 0); break;
                case 0x11: const b4 = pop(); const a4 = pop(); push((a4 - b4) | 0); break;
                case 0x12: push(Math.imul(pop(), pop())); break;
                case 0x13: const b5 = pop(); const a5 = pop(); if(b5 === 0) throw 4; push((a5 / b5) | 0); break;
                case 0x14: const b6 = pop(); const a6 = pop(); if(b6 === 0) throw 4; push((a6 % b6) | 0); break;
                case 0x15: const b7 = pop(); const a7 = pop(); if(b7 === 0) throw 4; push(Math.trunc((a7 >>> 0) / (b7 >>> 0)) | 0); break;
                case 0x16: const b8 = pop(); const a8 = pop(); if(b8 === 0) throw 4; push(((a8 >>> 0) % (b8 >>> 0)) | 0); break;
                case 0x17: push(-pop() | 0); break;
                case 0x18: push((pop() & pop()) | 0); break;
                case 0x19: push((pop() | pop()) | 0); break;
                case 0x1A: push((pop() ^ pop()) | 0); break;
                case 0x1B: push(~pop() | 0); break;
                case 0x1C: const b9 = pop(); const a9 = pop(); push((a9 << (b9 & 31)) | 0); break;
                case 0x1D: const b10 = pop(); const a10 = pop(); push((a10 >> (b10 & 31)) | 0); break;
                case 0x1E: const b11 = pop(); const a11 = pop(); push((a11 >>> (b11 & 31)) | 0); break;
                case 0x20: push(pop() === pop() ? 1 : 0); break;
                case 0x21: const b12 = pop(); const a12 = pop(); push(a12 < b12 ? 1 : 0); break;
                case 0x22: const b13 = pop(); const a13 = pop(); push((a13 >>> 0) < (b13 >>> 0) ? 1 : 0); break;
                case 0x30: pc += read16(); break;
                case 0x31: const v2 = pop(); const off = read16(); if(v2 === 0) pc += off; break;
                case 0x32: const v3 = pop(); const off2 = read16(); if(v3 !== 0) pc += off2; break;
                case 0x33: if(csP >= 64) throw 7; const target = read16u(); cs[csP++] = pc; pc = target; break;
                case 0x34: if(csP <= 0) throw 8; pc = cs[--csP]; break;
                case 0x40: const addr = pop(); if(addr < 0 || addr > 255) throw 6; push(mem[addr]); break;
                case 0x41: const addr2 = pop(); const v4 = pop(); if(addr2 < 0 || addr2 > 255) throw 6; mem[addr2] = v4; break;
                case 0x50: const v5 = pop(); const s = v5.toString(); if(outP + s.length > 65536) throw 11; Buffer.from(s).copy(out, outP); outP += s.length; break;
                case 0x51: const v6 = pop(); if(outP + 1 > 65536) throw 11; out[outP++] = v6 & 255; break;
                case 0x52: push(inP < input.length ? input[inP++] : -1); break;
                case 0x53: exitCode = pop() & 255; break;
                default: throw 5;
            }
            if(op === 0x00 || op === 0x53) break;
        }
    } catch (e: any) {
        if (typeof e === 'number') exitCode = e;
        else throw e;
    }
    
    fs.writeFileSync(path.join(outInstDir, 'stdout.bin'), out.subarray(0, outP));
    fs.writeFileSync(path.join(outInstDir, 'exit.txt'), exitCode.toString());
}
