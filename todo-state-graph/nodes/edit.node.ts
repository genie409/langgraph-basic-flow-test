import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { UserStateSchemaType } from "../../types";
import { BasicStateAnnotation } from "../todo-state-graph";
import { editUserNameTool } from "../tools/edit/edit-username.tool";
import { editAgeTool } from "../tools/edit/edit-age.tool";
import { editGenderTool } from "../tools/edit/edit-gender.tool";
import { ChatAnthropic } from "@langchain/anthropic";
import { editAgentPrompt } from "../prompt/edit-agent.prompt";

// Anthropic API 키 환경변수에서 로드
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// 사용자 정보 편집을 위한 도구들을 하나의 ToolNode로 결합
// - editUserNameTool: 사용자 이름 변경
// - editAgeTool: 사용자 나이 변경
// - editGenderTool: 사용자 성별 변경
const toolNode = new ToolNode([
  editUserNameTool,
  editAgeTool,
  editGenderTool,
] as any);

// Claude Haiku 모델을 사용하는 LLM 인스턴스 생성
// - 낮은 temperature(0.1)로 일관된 도구 선택 보장
// - 스트리밍 모드 활성화
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
 * React Agent 패턴을 사용하여 사용자의 요청을 분석하고 적절한 편집 도구를 선택/실행합니다.
 * Todo 목록을 참조하여 어떤 작업을 수행해야 하는지 파악하고, 단계적으로 사용자 정보를 업데이트합니다.
 *
 * React Agent 동작 방식:
 * 1. 사용자 질문과 현재 상태, Todo 목록을 분석
 * 2. 필요한 도구(editUserName, editAge, editGender) 선택
 * 3. 도구 실행을 통한 상태 업데이트
 * 4. 작업 로그(actLog) 기록
 *
 * @param state 현재 워크플로우 상태 (사용자 정보, Todo 목록 포함)
 * @returns 편집 결과가 반영된 상태 (업데이트된 사용자 정보, 메시지, 작업 로그)
 */
export const editNode = async (state: typeof BasicStateAnnotation.State) => {
  // 현재 사용자 상태를 구조화된 객체로 구성
  const userState: UserStateSchemaType = {
    userName: state.userName,
    age: state.age,
    gender: state.gender,
  };

  // React Agent 생성 및 구성
  // - tools: 사용 가능한 편집 도구들
  // - llm: 의사결정을 위한 언어 모델
  // - prompt: 컨텍스트가 포함된 동적 프롬프트
  // - stateSchema: 상태 스키마 정의
  const agent = createReactAgent({
    tools: toolNode,
    llm: llm,
    prompt: editAgentPrompt(
      state.question, // 사용자의 원본 질문
      userState, // 현재 사용자 상태
      state.todos.filter((todo) => !todo.isDone) // 아직 완료되지 않은 Todo 목록만 필터링
    ),
    stateSchema: BasicStateAnnotation,
  });

  // Agent 실행: 메시지 히스토리를 기반으로 편집 작업 수행
  const result = await agent.invoke({
    messages: state.messages,
  });

  // 편집 결과를 상태에 반영하여 반환
  return {
    messages: result.messages, // 업데이트된 메시지 히스토리
    userName: result.userName, // 변경된 사용자 이름
    age: result.age, // 변경된 나이
    gender: result.gender, // 변경된 성별
    actLog: result.actLog, // 수행된 작업들의 로그
  };
};
