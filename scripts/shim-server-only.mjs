/**
 * Allow verify scripts to import modules that use `import "server-only"`
 * when run outside Next.js via tsx.
 */
import Module from "node:module";

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.apply(this, arguments);
};
