import fs from 'node:fs';
import path from 'node:path';

const I = process.env.MAKEFUN_INPUT_DIR || '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR || '/output';

for (const id of fs.readdirSync(I)) {
    const d = path.join(I, id);
    if (!fs.statSync(d).isDirectory()) continue;
    const od = path.join(O, id);
    fs.mkdirSync(od, { recursive: true });
    const prg = fs.readFileSync(path.join(d, 'program.bin'));
    const inp = fs.readFileSync(path.join(d, 'input.bin'));
    const ds = new Int32Array(256), cs = new Int32Array(64), mem = new Int32Array(256);
    let dp = 0, cp = 0, pc = 0, st = 0, inP = 0, outP = 0, code = 0;
    const out = Buffer.alloc(65536);

    const pop = () => ds[--dp];
    const push = (v: number) => ds[dp++] = v;
    const chk = (p: number, s: number) => {
        if (dp < p) throw 2;
        if (dp - p + s > 256) throw 3;
    };

    try {
        while (true) {
            if (st++ >= 1000000) throw 10;
            if (pc < 0 || pc >= prg.length) throw 9;
            const op = prg[pc];
            const i = op === 1 ? 1 : op === 2 ? 4 : (op >= 0x30 && op <= 0x33) ? 2 : 0;
            if (pc + 1 + i > prg.length) throw 9;
            const next = pc + 1 + i;
            pc = next;

            switch (op) {
                case 0x00: chk(0,0); code = 0; break;
                case 0x01: chk(0,1); push((prg[next - 1] << 24) >> 24); break;
                case 0x02: chk(0,1); push((prg[next - 4] | (prg[next - 3] << 8) | (prg[next - 2] << 16) | (prg[next - 1] << 24)) | 0); break;
                case 0x03: chk(1,0); pop(); break;
                case 0x04: chk(1,2); const v1 = pop(); push(v1); push(v1); break;
                case 0x05: chk(2,2); const b1 = pop(); const a1 = pop(); push(b1); push(a1); break;
                case 0x06: chk(2,3); const b2 = pop(); const a2 = pop(); push(a2); push(b2); push(a2); break;
                case 0x07: chk(3,3); const c3 = pop(); const b3 = pop(); const a3 = pop(); push(b3); push(c3); push(a3); break;
                case 0x10: chk(2,1); push((pop() + pop()) | 0); break;
                case 0x11: chk(2,1); const b4 = pop(); const a4 = pop(); push((a4 - b4) | 0); break;
                case 0x12: chk(2,1); push(Math.imul(pop(), pop())); break;
                case 0x13: chk(2,1); const b5 = pop(); const a5 = pop(); if(b5 === 0) throw 4; push(a5 === -2147483648 && b5 === -1 ? a5 : (a5 / b5) | 0); break;
                case 0x14: chk(2,1); const b6 = pop(); const a6 = pop(); if(b6 === 0) throw 4; push(b6 === -1 ? 0 : a6 % b6 | 0); break;
                case 0x15: chk(2,1); const b7 = pop(); const a7 = pop(); if(b7 === 0) throw 4; push(Math.trunc((a7 >>> 0) / (b7 >>> 0)) | 0); break;
                case 0x16: chk(2,1); const b8 = pop(); const a8 = pop(); if(b8 === 0) throw 4; push(((a8 >>> 0) % (b8 >>> 0)) | 0); break;
                case 0x17: chk(1,1); push(-pop() | 0); break;
                case 0x18: chk(2,1); push((pop() & pop()) | 0); break;
                case 0x19: chk(2,1); push((pop() | pop()) | 0); break;
                case 0x1A: chk(2,1); push((pop() ^ pop()) | 0); break;
                case 0x1B: chk(1,1); push(~pop() | 0); break;
                case 0x1C: chk(2,1); const b9 = pop(); const a9 = pop(); push((a9 << (b9 & 31)) | 0); break;
                case 0x1D: chk(2,1); const b10 = pop(); const a10 = pop(); push((a10 >> (b10 & 31)) | 0); break;
                case 0x1E: chk(2,1); const b11 = pop(); const a11 = pop(); push((a11 >>> (b11 & 31)) | 0); break;
                case 0x20: chk(2,1); push(pop() === pop() ? 1 : 0); break;
                case 0x21: chk(2,1); const b12 = pop(); const a12 = pop(); push(a12 < b12 ? 1 : 0); break;
                case 0x22: chk(2,1); const b13 = pop(); const a13 = pop(); push((a13 >>> 0) < (b13 >>> 0) ? 1 : 0); break;
                case 0x30: chk(0,0); pc += ((prg[next - 2] | (prg[next - 1] << 8)) << 16 >> 16); break;
                case 0x31: chk(1,0); const v2 = pop(); const off = ((prg[next - 2] | (prg[next - 1] << 8)) << 16 >> 16); if(v2 === 0) pc += off; break;
                case 0x32: chk(1,0); const v3 = pop(); const off2 = ((prg[next - 2] | (prg[next - 1] << 8)) << 16 >> 16); if(v3 !== 0) pc += off2; break;
                case 0x33: chk(0,0); if(cp >= 64) throw 7; const target = (prg[next - 2] | (prg[next - 1] << 8)) >>> 0; cs[cp++] = pc; pc = target; break;
                case 0x34: chk(0,0); if(cp <= 0) throw 8; pc = cs[--cp]; break;
                case 0x40: chk(1,1); const addr = pop(); if(addr < 0 || addr > 255) throw 6; push(mem[addr]); break;
                case 0x41: chk(2,0); const addr2 = pop(); const v4 = pop(); if(addr2 < 0 || addr2 > 255) throw 6; mem[addr2] = v4; break;
                case 0x50: chk(1,0); const v5 = pop(); const s = v5.toString(); if(outP + s.length > 65536) throw 11; Buffer.from(s).copy(out, outP); outP += s.length; break;
                case 0x51: chk(1,0); const v6 = pop(); if(outP + 1 > 65536) throw 11; out[outP++] = v6 & 255; break;
                case 0x52: chk(0,1); push(inP < inp.length ? inp[inP++] : -1); break;
                case 0x53: chk(1,0); code = pop() & 255; break;
                default: throw 5;
            }
            if (op === 0x00 || op === 0x53) break;
        }
    } catch (e: any) {
        if (typeof e === 'number') code = e;
        else throw e;
    }

    fs.writeFileSync(path.join(od, 'stdout.bin'), out.subarray(0, outP));
    fs.writeFileSync(path.join(od, 'exit.txt'), code.toString());
}
