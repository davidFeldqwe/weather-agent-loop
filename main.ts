import { openai } from "@ai-sdk/openai";
import { runAgent } from "./agent.ts";

const prompt = process.argv.slice(2).join(" ") || "Which is warmer right now, London or Tel Aviv?";

const { text, steps } = await runAgent({ model: openai("gpt-4o-mini"), prompt });

steps.forEach((step, i) => {
  for (const call of step.toolCalls) {
    console.log(`step ${i + 1}: ${call.toolName}(${JSON.stringify(call.input)})`);
  }
  for (const result of step.toolResults) {
    console.log(`step ${i + 1}: -> ${String(result.output)}`);
  }
});
console.log(`\n${text}`);
