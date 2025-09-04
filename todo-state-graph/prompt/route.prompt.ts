import { ChatPromptTemplate } from "@langchain/core/prompts";

export const routePromptTemplate = ChatPromptTemplate.fromTemplate(
  "user question: {question}\n 유저의 질문을 보고 유저의 이름, 나이, 성별을 변경해야 할 경우 edit, 변경하지 않고 일반적인 답변을 하면 될 경우 answer를 반환해줘."
);
