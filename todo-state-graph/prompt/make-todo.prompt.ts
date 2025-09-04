import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * Todo 목록 생성을 위한 프롬프트 템플릿
 *
 * 사용자의 질문을 분석하여 수행해야 할 작업들을 단계별로 분해하고
 * 구조화된 Todo 목록을 생성하는 프롬프트입니다.
 *
 * 역할: 작업 계획 수립자(Planner)
 * - 사용자 요청을 세부 작업으로 분해
 * - 각 작업을 논리적 순서로 정렬
 * - 실행 가능한 단위로 Todo 항목 생성
 *
 * 출력 형식: RawTodoListSchema에 맞는 구조화된 데이터
 * - todos: Todo 객체 배열
 *   - content: 작업 내용 설명
 *   - isDone: 완료 상태 (기본값: false)
 *
 * 사용 예시:
 * 입력: "이름을 김철수로 바꾸고 나이를 25살로 변경해줘"
 * 출력: [
 *   { content: "사용자 이름을 김철수로 변경", isDone: false },
 *   { content: "사용자 나이를 25살로 변경", isDone: false }
 * ]
 */
export const makeTodoPrompt = ChatPromptTemplate.fromTemplate(
  `
  너의 역할은 유저의 질문을 바탕으로 어떠한 행동을 할지 계획을 세우는 planner야. 
  아래의 유저의 질문을 바탕으로 하여 어떠한 작업을 수행하여야 할지 아주 step by step으로 생각하여 todo list를 작성해줘.
  user question: {question}\n
  
  
  `
);
