import { TodoSchemaType, UserStateSchemaType } from "../../types";

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
