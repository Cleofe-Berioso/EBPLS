import fs from "fs";
import path from "path";

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === "route.ts") acc.push(full);
  }
  return acc;
}

const apiRoot = path.join(process.cwd(), "src", "app", "api");
const files = walk(apiRoot);
let updated = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const before = content;

  // Add missing internal message when status logic references `message`.
  content = content.replace(
    /(\} catch \(error\) \{\s*\n)(\s*const status =\s*\n\s*message ===)/g,
    '$1    const message = error instanceof Error ? error.message : "";\n$2'
  );

  content = content.replace(
    /(\} catch \(error\) \{\s*\n)(\s*const status = message ===)/g,
    '$1    const message = error instanceof Error ? error.message : "";\n$2'
  );

  content = content.replace(
    /(\} catch \(error\) \{\s*\n)(\s*if \(message ===)/g,
    '$1    const message = error instanceof Error ? error.message : "";\n$2'
  );

  // Fix broken indentation on return after status block
  content = content.replace(
    /(\n\s*: 400;\s*\n)\s{6}return NextResponse\.json\(\{ error: safeApiErrorMessage/g,
    "$1    return NextResponse.json({ error: safeApiErrorMessage"
  );

  if (content !== before) {
    fs.writeFileSync(file, content);
    updated++;
    console.log("fixed", file);
  }
}

console.log("total", updated);
