import { ChatAnthropic } from "@langchain/anthropic";
import { makeTodoPrompt } from "../prompt/make-todo.prompt";
import { BasicStateAnnotation } from "../todo-state-graph";
import { RawTodoListSchema, RawTodoListSchemaType } from "../../types";
import { v4 as uuidv4 } from "uuid";

// Anthropic API 키 환경변수에서 로드
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Claude Haiku 모델을 사용하는 LLM 인스턴스 생성
// - 낮은 temperature(0.1)로 일관된 결과 보장
// - 스트리밍 모드 활성화
const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0.1,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
  streaming: true,
});

/**
 * Todo 목록을 생성하는 노드
 *
 * 워크플로우의 첫 번째 단계로, 사용자의 질문을 분석하여
 * 수행해야 할 작업들을 step-by-step으로 분해하고 Todo 목록을 생성합니다.
 *
 * 주요 기능:
 * - 사용자 질문을 기반으로 작업 계획 수립
 * - 구조화된 Todo 리스트 생성 (content, isDone 포함)
 * - 각 Todo에 고유 ID 할당 (UUID v4 사용)
 *
 * @param state 현재 워크플로우 상태 (사용자 질문 포함)
 * @returns 생성된 Todo 목록이 포함된 상태 업데이트
 */
export const makeTodoNode = async (
  state: typeof BasicStateAnnotation.State
) => {
  // makeTodoPrompt와 LLM을 체인으로 연결하여 구조화된 출력 생성
  const chain = makeTodoPrompt.pipe(
    llm.withStructuredOutput<RawTodoListSchemaType>(RawTodoListSchema)
  );

  // 사용자 질문을 기반으로 Todo 리스트 생성 요청
  const result = await chain.invoke({
    question: state.question,
  });

  // 생성된 각 Todo에 고유 ID를 부여하여 반환
  return {
    todos: result.todos.map((todo) => ({
      ...todo,
      id: uuidv4(), // UUID v4로 고유 식별자 생성
    })),
  };
};
