import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

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
