import { BasicStateAnnotation } from "../todo-state-graph";

/**
 * Todo 업데이트 엣지 조건 함수
 *
 * Todo 업데이트 노드 실행 후 모든 Todo 항목의 완료 상태를 검사하여
 * 워크플로우를 종료할지 아니면 추가 작업을 위해 라우팅으로 돌아갈지 결정합니다.
 *
 * 조건 분기 로직:
 * - 모든 Todo가 완료된 경우 (isDone: true) → "END": 워크플로우 종료
 * - 아직 완료되지 않은 Todo가 있는 경우 → "NEED_ACT": 라우팅 노드로 복귀하여 추가 작업 수행
 *
 * 이를 통해 사용자의 복잡한 요청(예: "이름을 바꾸고 나이도 바꿔줘")을
 * 단계별로 처리할 수 있는 반복 구조를 구현합니다.
 *
 * @param state 현재 워크플로우 상태 (todos 배열 포함)
 * @returns "END" (종료) 또는 "NEED_ACT" (추가 작업 필요)
 */
export const updateTodoEdgeCondition = (
  state: typeof BasicStateAnnotation.State
) => {
  // 모든 Todo 항목이 완료되었는지 검사
  // Array.every()를 사용하여 모든 요소의 isDone이 true인지 확인
  return state["todos"].every((todo) => todo.isDone) ? "END" : "NEED_ACT";
};
