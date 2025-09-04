import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * 라우팅 결정을 위한 프롬프트 템플릿
 *
 * 사용자의 질문을 분석하여 워크플로우의 다음 단계를 결정하는 프롬프트입니다.
 * LLM에게 사용자 정보 편집이 필요한지 판단하도록 지시하며,
 * 구조화된 출력(routeSchema)을 통해 "edit" 또는 "answer" 중 하나를 반환받습니다.
 *
 * 판단 기준:
 * - 사용자 이름, 나이, 성별 변경 요청 → "edit" 반환
 * - 일반적인 질문이나 대화 → "answer" 반환
 *
 * 사용 예시:
 * - "이름을 김철수로 바꿔줘" → edit
 * - "나이를 25살로 변경해줘" → edit
 * - "안녕하세요" → answer
 * - "날씨가 어때?" → answer
 */
export const routePromptTemplate = ChatPromptTemplate.fromTemplate(
  "user question: {question}\n 유저의 질문을 보고 유저의 이름, 나이, 성별을 변경해야 할 경우 edit, 변경하지 않고 일반적인 답변을 하면 될 경우 answer를 반환해줘."
);
