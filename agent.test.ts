import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { MAX_STEPS, lookUpWeather, runAgent } from "./agent.ts";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

function callWeather(id: string, city: string) {
  return {
    content: [
      { type: "tool-call" as const, toolCallId: id, toolName: "getWeather", input: JSON.stringify({ city }) },
    ],
    finishReason: { unified: "tool-calls" as const, raw: "tool_calls" },
    usage,
    warnings: [],
  };
}

function answer(text: string) {
  return {
    content: [{ type: "text" as const, text }],
    finishReason: { unified: "stop" as const, raw: "stop" },
    usage,
    warnings: [],
  };
}

/** A deterministic stand-in for the model: returns the scripted turns in order. */
function scriptedModel(turns: Array<ReturnType<typeof callWeather> | ReturnType<typeof answer>>) {
  let call = 0;
  return new MockLanguageModelV4({
    doGenerate: async () => {
      const turn = turns[Math.min(call, turns.length - 1)];
      call++;
      return turn!;
    },
  });
}

describe("lookUpWeather", () => {
  it("matches cities case-insensitively and reports unknown ones", () => {
    expect(lookUpWeather("Tel Aviv")).toBe("The weather in Tel Aviv is 27°C and sunny.");
    expect(lookUpWeather("Atlantis")).toBe("No weather data for Atlantis.");
  });
});

describe("runAgent", () => {
  it("feeds each tool result back to the model until it answers", async () => {
    const model = scriptedModel([
      callWeather("1", "London"),
      callWeather("2", "Tel Aviv"),
      answer("Tel Aviv is warmer."),
    ]);

    const { text, steps } = await runAgent({ model, prompt: "Which is warmer, London or Tel Aviv?" });

    expect(text).toBe("Tel Aviv is warmer.");
    expect(steps).toHaveLength(3);
    expect(steps.flatMap((step) => step.toolResults.map((result) => result.output))).toEqual([
      "The weather in London is 14°C and light rain.",
      "The weather in Tel Aviv is 27°C and sunny.",
    ]);
    // The third model call sees both tool results in its prompt.
    expect(JSON.stringify(model.doGenerateCalls[2]!.prompt)).toContain("27°C and sunny");
  });

  it("stops at MAX_STEPS when the model never stops calling tools", async () => {
    const model = scriptedModel([callWeather("loop", "London")]);

    const { text, steps } = await runAgent({ model, prompt: "Weather in London?" });

    expect(steps).toHaveLength(MAX_STEPS);
    expect(model.doGenerateCalls).toHaveLength(MAX_STEPS);
    expect(text).toBe("");
  });
});
