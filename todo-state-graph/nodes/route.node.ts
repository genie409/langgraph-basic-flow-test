import { ChatAnthropic } from "@langchain/anthropic";
import { routePromptTemplate } from "../prompt/route.prompt";
import { routeSchema, RouteSchemaType } from "../../types";
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
 * 라우팅 결정을 수행하는 노드
 *
 * 사용자의 질문을 분석하여 사용자 정보 편집이 필요한지 판단하고,
 * 적절한 다음 노드("edit" 또는 "answer")를 결정합니다.
 *
 * @param state 현재 워크플로우 상태
 * @returns 다음 실행할 노드 정보
 */
export const routeNode = async (state: typeof BasicStateAnnotation.State) => {
  const chain = routePromptTemplate.pipe(
    llm.withStructuredOutput<RouteSchemaType>(routeSchema)
  );
  const result = await chain.invoke({
    question: state.question,
  });
  return {
    route_to: result.route,
  };
};
