import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

/**
 * Todo 목록 업데이트를 위한 프롬프트 템플릿
 *
 * 편집 작업 완료 후 Todo 목록의 상태를 업데이트하기 위한 프롬프트입니다.
 * 대화 히스토리, 작업 로그, 현재 Todo 상태를 종합 분석하여
 * 어떤 Todo 항목들이 완료되었는지 판단합니다.
 *
 * 프롬프트 구조:
 * 1. System Message: 역할과 목적 설명
 * 2. Messages Placeholder: 전체 대화 히스토리 삽입
 * 3. User Message: 분석할 데이터와 요청사항
 *
 * 입력 데이터:
 * - history: 전체 대화 메시지 배열
 * - question: 사용자의 원본 질문
 * - todos: 현재 Todo 목록 (JSON 문자열)
 * - actLog: 실행된 작업 로그 (JSON 문자열)
 *
 * 출력 형식: UpdateTodoSchema에 맞는 구조화된 데이터
 * - todos: 업데이트가 필요한 Todo 항목들
 *   - id: Todo 고유 식별자
 *   - isDone: 새로운 완료 상태
 *
 * 분석 기준:
 * - 작업 로그에 기록된 실행 작업과 Todo 내용 매칭
 * - 대화 흐름을 통한 작업 완료 여부 추론
 * - 사용자 질문과 실제 수행된 작업의 일치성 검증
 */
export const updateTodoPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
    너의 역할은 아래의 대화와 todo list, 그리고 actLog를 바탕으로 todo list의 상태를 업데이트 하는 거야.
    `,
  ],
  new MessagesPlaceholder("history"),
  [
    "user",
    `user question: {question}
    todo list: {todos}
    actLog: {actLog}
    위의 정보를 바탕으로 목록을 보고 수정이 필요한 todo의 id와 변경해야할 상태값(isDone)을 todos에 배열 형태로 반환해줘.

    
    `,
  ],
]);
