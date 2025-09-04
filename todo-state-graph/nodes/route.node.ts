import { ChatAnthropic } from "@langchain/anthropic";
import { routePromptTemplate } from "../prompt/route.prompt";
import { routeSchema, RouteSchemaType } from "../../types";
import { BasicStateAnnotation } from "../todo-state-graph";

// Anthropic API 키 환경변수에서 로드
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Claude Haiku 모델을 사용하는 LLM 인스턴스 생성
// - 낮은 temperature(0.1)로 일관된 라우팅 결정 보장
// - 스트리밍 모드 활성화
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
 * 사용자의 질문을 분석하여 워크플로우의 다음 단계를 결정하는 핵심 노드입니다.
 * 사용자 정보(이름, 나이, 성별) 편집이 필요한지 판단하여 적절한 경로로 안내합니다.
 *
 * 라우팅 로직:
 * - "edit": 사용자 정보 변경이 필요한 경우 (예: "이름을 김철수로 바꿔줘")
 * - "answer": 일반적인 질문/답변이 필요한 경우 (예: "안녕하세요")
 *
 * @param state 현재 워크플로우 상태 (사용자 질문 포함)
 * @returns 다음 실행할 노드 정보 (route_to: "edit" | "answer")
 */
export const routeNode = async (state: typeof BasicStateAnnotation.State) => {
  // routePromptTemplate와 LLM을 체인으로 연결하여 구조화된 라우팅 결정 생성
  const chain = routePromptTemplate.pipe(
    llm.withStructuredOutput<RouteSchemaType>(routeSchema)
  );

  // 사용자 질문을 분석하여 라우팅 결정 요청
  const result = await chain.invoke({
    question: state.question,
  });

  // 라우팅 결정 결과를 상태에 저장하여 다음 노드 결정
  return {
    route_to: result.route, // "edit" 또는 "answer"
  };
};
