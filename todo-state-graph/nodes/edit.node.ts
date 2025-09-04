import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { UserStateSchemaType } from "../../types";
import { BasicStateAnnotation } from "../todo-state-graph";
import { editUserNameTool } from "../tools/edit/edit-username.tool";
import { editAgeTool } from "../tools/edit/edit-age.tool";
import { editGenderTool } from "../tools/edit/edit-gender.tool";
import { ChatAnthropic } from "@langchain/anthropic";
import { editAgentPrompt } from "../prompt/edit-agent.prompt";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// 편집 도구들을 하나의 노드로 결합
const toolNode = new ToolNode([
  editUserNameTool,
  editAgeTool,
  editGenderTool,
] as any);

const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0.1,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
  streaming: true,
});

/**
 * 사용자 정보 편집을 수행하는 노드
 *
 * React Agent를 생성하여 사용자의 질문에 따라 적절한 편집 도구를 선택하고 실행합니다.
 * 현재 사용자 상태를 프롬프트에 포함하여 컨텍스트를 제공합니다.
 *
 * @param state 현재 워크플로우 상태
 * @returns 편집 결과가 반영된 상태
 */
export const editNode = async (state: typeof BasicStateAnnotation.State) => {
  // 현재 사용자 상태 구성
  const userState: UserStateSchemaType = {
    userName: state.userName,
    age: state.age,
    gender: state.gender,
  };

  // React Agent 생성 및 실행
  const agent = createReactAgent({
    tools: toolNode,
    llm: llm,
    prompt: editAgentPrompt(
      state.question,
      userState,
      state.todos.filter((todo) => !todo.isDone)
    ),
    stateSchema: BasicStateAnnotation,
  });

  const result = await agent.invoke({
    messages: state.messages,
  });

  return {
    messages: result.messages,
    userName: result.userName,
    age: result.age,
    gender: result.gender,
    actLog: result.actLog,
  };
};
