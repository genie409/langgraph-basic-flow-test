import "dotenv/config";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const MultiplyToolSchema = z.object({
  a: z.number().describe("First operand"),
  b: z.number().describe("Second operand"),
});

type MultiplyToolInput = z.infer<typeof MultiplyToolSchema>;

const multiplyTool = new DynamicStructuredTool<
  typeof MultiplyToolSchema,
  MultiplyToolInput,
  string
>({
  name: "multiply",
  description: "Multiply two numbers.",
  schema: MultiplyToolSchema,
  // eslint-disable-next-line @typescript-eslint/require-await
  func: async ({ a, b }: MultiplyToolInput) => {
    return JSON.stringify({ result: a * b });
  },
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const toolNode = new ToolNode([multiplyTool] as any);

const main = async () => {
  const llm = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.1,
    maxTokens: 1000,
    apiKey: ANTHROPIC_API_KEY,
    streaming: true,
  });

  const agent = createReactAgent({
    llm: llm,
    tools: toolNode,
  });

  const messages = [new HumanMessage("5 * 15의 값은?")];

  const result = await agent.invoke({ messages: messages });

  console.log(result);
};

void main();
