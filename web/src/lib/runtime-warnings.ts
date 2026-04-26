const globalForWarnings = globalThis as typeof globalThis & {
  __ebplsWarningsPatched?: boolean;
};

if (!globalForWarnings.__ebplsWarningsPatched && typeof process !== "undefined") {
  const originalEmitWarning = process.emitWarning.bind(process);

  process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
    const code = typeof args[1] === "string" ? args[1] : typeof args[0] === "string" ? args[0] : undefined;
    const message =
      typeof warning === "string"
        ? warning
        : warning instanceof Error
          ? warning.message
          : "";

    // Suppress a dependency-generated Node deprecation warning that is not emitted by project code.
    if (code === "DEP0169" || message.includes("url.parse()")) {
      return;
    }

    return originalEmitWarning(warning as never, ...(args as never[]));
  }) as typeof process.emitWarning;

  globalForWarnings.__ebplsWarningsPatched = true;
}

export {};
