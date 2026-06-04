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
const files = walk(apiRoot).filter((f) =>
  fs.readFileSync(f, "utf8").includes("error instanceof Error ? error.message")
);

let updated = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const before = content;

  if (!content.includes("safeApiErrorMessage") && content.includes('from "next/server";')) {
    content = content.replace(
      'from "next/server";',
      'from "next/server";\nimport { safeApiErrorMessage } from "@/lib/api-errors";'
    );
  }

  // Pattern: const message = ...; return NextResponse.json({ error: message }, { status: N });
  content = content.replace(
    /const message = error instanceof Error \? error\.message : ("[^"]+");\s*\n\s*return NextResponse\.json\(\{ error: message \}, \{ status: (\d+) \}\);/g,
    "return NextResponse.json({ error: safeApiErrorMessage(error, $1) }, { status: $2 });"
  );

  // Pattern: const message = ...; const status = ...; return NextResponse.json({ error: message }, { status });
  content = content.replace(
    /const message = error instanceof Error \? error\.message : ("[^"]+");\s*\n(\s*const status[\s\S]*?)\n\s*return NextResponse\.json\(\{ error: message \}, \{ status \}\);/g,
    (match, fallback, statusBlock) => {
      return `${statusBlock.trim()}\n      return NextResponse.json({ error: safeApiErrorMessage(error, ${fallback}) }, { status });`;
    }
  );

  // Inline ternary assigned to message then returned
  content = content.replace(
    /const message =\s*\n\s*error instanceof Error \? error\.message : ("[^"]+");\s*\n\s*const status = ([^;]+);\s*\n\s*return NextResponse\.json\(\{ error: message \}, \{ status \}\);/g,
    "const status = $2;\n    return NextResponse.json({ error: safeApiErrorMessage(error, $1) }, { status });"
  );

  if (content !== before) {
    fs.writeFileSync(file, content);
    updated++;
    console.log("updated", file);
  }
}

// extensions toggle
const togglePath = path.join(
  apiRoot,
  "superadmin/settings/extensions/[extensionId]/toggle/route.ts"
);
if (fs.existsSync(togglePath)) {
  let content = fs.readFileSync(togglePath, "utf8");
  if (!content.includes("safeApiErrorMessage")) {
    content = content.replace(
      'from "next/server";',
      'from "next/server";\nimport { safeApiErrorMessage } from "@/lib/api-errors";'
    );
    content = content.replace(
      /if \(error instanceof Error\) \{\s*return NextResponse\.json\(\{ error: error\.message \}, \{ status: 400 \}\);\s*\}/,
      'return NextResponse.json({ error: safeApiErrorMessage(error, "Failed to update extension status.") }, { status: 400 });'
    );
    fs.writeFileSync(togglePath, content);
    console.log("updated", togglePath);
    updated++;
  }
}

console.log("total", updated);
