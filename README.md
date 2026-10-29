# weather-agent-loop

A minimal multi-step tool-calling agent in TypeScript, with no build step. It follows Matt Pocock's AI Hero guide [Build Your First Agent With Vercel's AI SDK](https://www.aihero.dev/agents-with-vercel-ai-sdk). The model calls a tool and reads the result. Then it either calls a tool again or answers. A step limit ends the loop if it never answers.

The agent has one tool, `getWeather`, backed by a stub table for London, Tel Aviv and Reykjavik. There is no real weather API. Ask it "Which is warmer, London or Tel Aviv?" and it looks up each city in its own step, then answers in a final step.

## Run it

```sh
pnpm install
cp .env.example .env   # set OPENAI_API_KEY in that file, or export it
pnpm start "Which is warmer right now, London or Tel Aviv?"
```

The command prints each step's tool calls and tool results, then the answer. The model is `gpt-4o-mini`.

```sh
pnpm test
```

Tests use `MockLanguageModelV4` from `ai/test` with a scripted sequence of turns, so they run without an API key. One test checks that each tool result is fed back into the next model call until the model answers. The other checks that a model that never stops calling tools is cut off at `MAX_STEPS`.

## API notes

The guide was written for an older SDK. This repo uses `ai` 7 and `@ai-sdk/openai` 4, which differ in a few ways:

- The guide's `maxSteps` is now `stopWhen: isStepCount(n)`.
- A tool's `parameters` is now `inputSchema`.
- `system` is deprecated in favor of `instructions`.
- The guide streams with `streamText`. This repo uses `generateText` so the CLI and tests get the full `steps` array in one result.
