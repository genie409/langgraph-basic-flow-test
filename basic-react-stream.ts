import "dotenv/config";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { convertAIChunkToAnswer } from "./utils";

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

  /**
   * Streaming modes (per LangGraph docs):
   * - values: 전체 state 스냅샷(각 스텝 완료 시점의 전체 상태)
   * - updates: 변경된 state만(각 스텝에서 바뀐 부분에 대한 업데이트 이벤트)
   * - messages: LLM이 생성하는 토큰 스트림
   * - custom: 도구 실행 중 config.writer로 임의 업데이트 스트림
   * 여러 모드를 함께 사용할 수 있습니다: ['updates', 'messages', 'custom']
   * 참고: https://langchain-ai.github.io/langgraphjs/agents/streaming/#agent-progress
   */

  let answerChunk: AIMessageChunk | undefined;
  for await (const chunk of await agent.stream(
    { messages: messages },
    { streamMode: ["values", "messages"] }
  )) {
    // console.log(chunk);
    // console.log('\n--------------------------------------------\n');
    if (chunk[0] === "messages") {
      const chunkMessage = chunk[1][0];
      if (chunkMessage.getType() === "ai") {
        if (answerChunk === undefined)
          answerChunk = chunkMessage as AIMessageChunk;
        else answerChunk = answerChunk.concat(chunkMessage as AIMessageChunk);

        const answer = convertAIChunkToAnswer(answerChunk);

        console.log(answer);
      }
    }
  }
};

void main();
