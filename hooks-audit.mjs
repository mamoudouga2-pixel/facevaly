import fs from "fs";
import path from "path";

function walk(dir, files = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory() && e.name !== "node_modules") walk(p, files);
        else if (/\.(tsx|jsx)$/.test(e.name)) files.push(p);
    }
    return files;
}

const hookRe =
    /\buse(?:State|Effect|Memo|Callback|Ref|Reducer|Context|LayoutEffect|ImperativeHandle|Id|DeferredValue|Transition|SyncExternalStore)\s*\(/;

function analyzeFile(file) {
    const src = fs.readFileSync(file, "utf8");
    const lines = src.split(/\r?\n/);
    const violations = [];
    let depth = 0;
    let inFunc = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (depth === 0) {
            const m = trimmed.match(
                /^(?:export\s+default\s+)?function\s+([A-Z]\w*)/
            );
            if (m) {
                inFunc = {
                    name: m[1],
                    start: i + 1,
                    hooks: [],
                    earlyReturns: [],
                };
            }
        }

        if (inFunc) {
            if (hookRe.test(line) && !trimmed.startsWith("//")) {
                inFunc.hooks.push(i + 1);
            }

            if (depth === 1 && /^\s*if\s*\(/.test(line)) {
                for (let j = i; j < Math.min(i + 8, lines.length); j++) {
                    const candidate = lines[j];
                    if (
                        /^\s*return\b/.test(candidate) &&
                        !/^\s*return\s*;/.test(candidate) &&
                        !candidate.includes("return ()") &&
                        !candidate.includes("return undefined")
                    ) {
                        inFunc.earlyReturns.push(j + 1);
                        break;
                    }
                }
            }
        }

        for (const ch of line) {
            if (ch === "{") depth++;
            else if (ch === "}") {
                depth--;
                if (depth === 0 && inFunc) {
                    if (inFunc.hooks.length && inFunc.earlyReturns.length) {
                        const bad = inFunc.earlyReturns.filter((r) =>
                            inFunc.hooks.some((h) => h > r)
                        );
                        if (bad.length) {
                            violations.push({
                                file,
                                func: inFunc.name,
                                start: inFunc.start,
                                earlyReturns: bad,
                                hooksAfter: inFunc.hooks.filter(
                                    (h) => h > Math.min(...bad)
                                ),
                            });
                        }
                    }
                    inFunc = null;
                }
            }
        }
    }

    return violations;
}

const root = path.resolve("src");
const all = [];
for (const f of walk(root)) {
    all.push(...analyzeFile(f));
}

console.log(JSON.stringify(all, null, 2));
