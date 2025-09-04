import { ChatPromptTemplate } from "@langchain/core/prompts";
import { UserStateSchemaType } from "../types";

export const routePromptTemplate = ChatPromptTemplate.fromTemplate(
  "user question: {question}\n 유저의 질문을 보고 유저의 이름, 나이, 성별을 변경해야 할 경우 edit, 변경하지 않고 일반적인 답변을 하면 될 경우 answer를 반환해줘."
);

export const reactAgentPrompt = (
  question: string,
  userState: UserStateSchemaType
) => {
  return `당신은 유저의 이름, 나이, 성별을 변경하는 역할을 합니다. 유저의 질문과 현태 상태를 보고 적절한 tool을 선택하여 유저의 이름, 나이, 성별을 변경하세요.
    \n유저의 질문: ${question}
    \n현태 상태: ${JSON.stringify(userState)}
    `;
};

export const routeEditAgentPrompt = ChatPromptTemplate.fromTemplate(
  `당신은 유저의 이름, 나이, 성별을 변경하는 역할을 합니다. 유저의 질문과 현태 상태를 보고 적절한 tool을 선택하여 유저의 이름, 나이, 성별을 변경하기 위한 다음 행동을 선택하세요.
  유저의 질문: {question}
  현태 상태: {userState}
  다음 행동:
    -  editUserName: 유저의 이름을 변경하는 행동
    -  editAge: 유저의 나이를 변경하는 행동
    -  editGender: 유저의 성별을 변경하는 행동
  `
);
