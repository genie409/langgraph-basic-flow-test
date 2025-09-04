import { ChatAnthropic } from "@langchain/anthropic";
import { BasicStateAnnotation } from "../todo-state-graph";
import { UpdateTodoSchema, UpdateTodoSchemaType } from "../../types";
import { updateTodoPrompt } from "../prompt/update-todo.prompt";

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
 * Todo 목록의 완료 상태를 업데이트하는 노드
 *
 * 편집 작업 완료 후 실행되며, 대화 히스토리와 작업 로그를 분석하여
 * 어떤 Todo 항목들이 완료되었는지 판단하고 상태를 업데이트합니다.
 *
 * 주요 기능:
 * - 대화 히스토리 분석을 통한 완료 작업 식별
 * - 작업 로그(actLog)를 기반으로 한 Todo 상태 추론
 * - Todo 항목별 isDone 플래그 업데이트
 * - 완료되지 않은 Todo가 있을 경우 추가 작업 필요성 판단
 *
 * @param state 현재 워크플로우 상태 (메시지, Todo 목록, 작업 로그 포함)
 * @returns 업데이트된 Todo 목록이 포함된 상태
 */
export const updateTodoNode = async (
  state: typeof BasicStateAnnotation.State
) => {
  // updateTodoPrompt와 LLM을 체인으로 연결하여 구조화된 출력 생성
  const chain = updateTodoPrompt.pipe(
    llm.withStructuredOutput<UpdateTodoSchemaType>(UpdateTodoSchema)
  );

  // 대화 히스토리, 질문, Todo 목록, 작업 로그를 종합하여 업데이트 요청
  const result = await chain.invoke({
    history: state.messages, // 전체 대화 히스토리
    question: state.question, // 원본 사용자 질문
    todos: JSON.stringify(state.todos), // 현재 Todo 목록 (JSON 문자열로 변환)
    actLog: JSON.stringify(state.actLog), // 실행된 작업 로그 (JSON 문자열로 변환)
  });

  // 디버깅용: 업데이트될 Todo 목록 출력
  console.log("update todo list", result.todos);

  // 기존 Todo 목록을 순회하면서 업데이트가 필요한 항목들의 isDone 상태 변경
  const newTodos = state.todos.map((todo) => {
    // LLM이 업데이트해야 한다고 판단한 Todo 항목 찾기
    const updateTodo = result.todos.find((t) => t.id === todo.id);
    if (updateTodo) {
      return {
        ...todo,
        isDone: updateTodo.isDone, // isDone 상태만 업데이트
      };
    }
    return todo; // 업데이트가 필요하지 않은 Todo는 그대로 유지
  });

  return {
    todos: newTodos,
  };
};
