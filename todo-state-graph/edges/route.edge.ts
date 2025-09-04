import { BasicStateAnnotation } from "../todo-state-graph";

/**
 * 라우팅 엣지 조건 함수
 *
 * 라우팅 노드에서 설정된 route_to 값을 기반으로 다음 실행할 노드를 결정합니다.
 * 이 함수는 LangGraph의 조건부 엣지(Conditional Edge)에서 사용되어
 * 워크플로우의 분기점을 제어합니다.
 *
 * 반환값에 따른 노드 분기:
 * - "edit": 사용자 정보 편집이 필요한 경우 → editNode 실행
 * - "answer": 일반적인 답변이 필요한 경우 → answerNode 실행
 *
 * @param state 현재 워크플로우 상태 (route_to 필드 포함)
 * @returns route_to 값 ("edit" | "answer")
 */
export const routeEdgeCondition = (
  state: typeof BasicStateAnnotation.State
) => {
  // 라우팅 노드에서 결정된 다음 노드 정보를 반환
  return state["route_to"];
};
