import { ChatPromptTemplate } from "@langchain/core/prompts";

export const makeTodoPrompt = ChatPromptTemplate.fromTemplate(
  `
  너의 역할은 유저의 질문을 바탕으로 어떠한 행동을 할지 계획을 세우는 planner야. 
  아래의 유저의 질문을 바탕으로 하여 어떠한 작업을 수행하여야 할지 아주 step by step으로 생각하여 todo list를 작성해줘.
  user question: {question}\n
  
  
  `
);
