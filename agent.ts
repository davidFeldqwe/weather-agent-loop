import { generateText, isStepCount, tool, type LanguageModel } from "ai";
import { z } from "zod";

/** Hard stop for the loop: the model gets at most this many turns. */
export const MAX_STEPS = 5;

/** Stub weather data, so answers are predictable. Swap in a real weather API to make it useful. */
const WEATHER: Record<string, { tempC: number; conditions: string }> = {
  london: { tempC: 14, conditions: "light rain" },
  "tel aviv": { tempC: 27, conditions: "sunny" },
  reykjavik: { tempC: 4, conditions: "windy" },
};

export function lookUpWeather(city: string): string {
  const weather = WEATHER[city.trim().toLowerCase()];
  if (!weather) return `No weather data for ${city}.`;
  return `The weather in ${city} is ${weather.tempC}°C and ${weather.conditions}.`;
}

export const getWeatherTool = tool({
  description: "Get the current weather in the specified city",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  execute: async ({ city }) => lookUpWeather(city),
});

export async function runAgent({ model, prompt }: { model: LanguageModel; prompt: string }) {
  const result = await generateText({
    model,
    prompt,
    instructions:
      "Answer weather questions. Call getWeather once per city you need, then answer from the tool results.",
    tools: { getWeather: getWeatherTool },
    stopWhen: isStepCount(MAX_STEPS),
  });
  return { text: result.text, steps: result.steps };
}
