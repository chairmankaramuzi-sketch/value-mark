// Mock 'server-only' package for Node.js test runner
try {
  const resolved = require.resolve("server-only");
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
  } as unknown as NodeModule;
} catch {
  // Ignore if server-only is not present
}
