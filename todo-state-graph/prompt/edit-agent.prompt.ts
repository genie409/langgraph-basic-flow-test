import { TodoSchemaType, UserStateSchemaType } from "../../types";

/**
 * 편집 에이전트를 위한 동적 프롬프트 생성 함수
 *
 * React Agent가 사용자 정보 편집 작업을 수행할 때 사용하는 프롬프트를 동적으로 생성합니다.
 * 현재 상황에 맞는 컨텍스트 정보를 포함하여 Agent가 적절한 도구를 선택하도록 안내합니다.
 *
 * 포함되는 컨텍스트 정보:
 * - 사용자의 원본 질문: 무엇을 변경하고 싶어하는지
 * - 완료되지 않은 Todo 목록: 아직 수행해야 할 작업들
 * - 현재 사용자 상태: userName, age, gender의 현재 값
 *
 * Agent의 역할과 책임:
 * - 제공된 도구(editUserName, editAge, editGender)를 적절히 선택
 * - Todo 목록을 참고하여 우선순위에 따른 작업 수행
 * - 현재 상태를 고려한 정확한 변경 작업 실행
 *
 * @param question 사용자의 원본 질문
 * @param userState 현재 사용자 상태 (이름, 나이, 성별)
 * @param todos 아직 완료되지 않은 Todo 목록
 * @returns React Agent용 프롬프트 문자열
 */
export const editAgentPrompt = (
  question: string,
  userState: UserStateSchemaType,
  todos: TodoSchemaType[]
) => {
  return `당신은 유저의 이름, 나이, 성별을 변경하는 역할을 합니다. 유저의 질문과 해야할 Todo, 현태 상태를 보고 적절한 tool을 선택하여 유저의 이름, 나이, 성별을 변경하세요.
      \n해야할 Todo: ${JSON.stringify(todos.map((todo) => todo.content))}
      \n유저의 질문: ${question}
      \n현태 상태: ${JSON.stringify(userState)}
      `;
};
