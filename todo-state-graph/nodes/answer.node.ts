import { ChatAnthropic } from "@langchain/anthropic";
import { BasicStateAnnotation } from "../todo-state-graph";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0.1,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
  streaming: true,
});

/**
 * 일반적인 답변을 생성하는 노드
 *
 * 사용자 정보 편집이 필요하지 않은 경우 실행되며,
 * 기존 메시지들을 바탕으로 LLM이 답변을 생성합니다.
 *
 * @param state 현재 워크플로우 상태
 * @returns 생성된 답변 메시지
 */
export const answerNode = async (state: typeof BasicStateAnnotation.State) => {
  const response = await llm.invoke(state.messages);

  return {
    messages: [response],
  };
};
