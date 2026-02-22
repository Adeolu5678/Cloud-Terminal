const test = require("node:test");
const assert = require("node:assert/strict");
const { parseTmuxWindows } = require("../src/tmux");

test("parseTmuxWindows parses tmux output into typed window objects", () => {
  const raw = "0|shell|1\n1|agent-a|0\n2|agent-b|0\n";
  assert.deepEqual(parseTmuxWindows(raw), [
    { index: 0, name: "shell", active: true },
    { index: 1, name: "agent-a", active: false },
    { index: 2, name: "agent-b", active: false },
  ]);
});
