import { ChatAnthropic } from "@langchain/anthropic";
import { BasicStateAnnotation } from "../todo-state-graph";

// Anthropic API 키 환경변수에서 로드
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Claude Haiku 모델을 사용하는 LLM 인스턴스 생성
// - 낮은 temperature(0.1)로 일관된 답변 품질 보장
// - 스트리밍 모드 활성화로 실시간 응답 가능
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
 * 라우팅 노드에서 사용자 정보 편집이 필요하지 않다고 판단된 경우 실행됩니다.
 * 기존 대화 컨텍스트를 바탕으로 자연스러운 답변을 생성하여 사용자에게 제공합니다.
 *
 * 사용 시나리오:
 * - 일반적인 인사 또는 질문
 * - 사용자 정보 변경과 관련 없는 대화
 * - 정보 요청이나 도움말 요청
 *
 * @param state 현재 워크플로우 상태 (대화 히스토리 포함)
 * @returns 생성된 답변 메시지가 포함된 상태 업데이트
 */
export const answerNode = async (state: typeof BasicStateAnnotation.State) => {
  // 기존 메시지 히스토리를 기반으로 LLM 답변 생성
  const response = await llm.invoke(state.messages);

  // 생성된 답변을 메시지 배열에 추가하여 반환
  return {
    messages: [response],
  };
};
