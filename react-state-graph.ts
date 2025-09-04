/**
 * React State Graph - LangGraph를 사용한 사용자 정보 편집 워크플로우
 *
 * 이 파일은 사용자의 질문을 분석하여 사용자 정보(이름, 나이, 성별)를 편집하거나
 * 일반적인 답변을 제공하는 상태 기반 그래프 워크플로우를 구현합니다.
 *
 * 주요 구성 요소:
 * - State Management: BasicStateAnnotation을 통한 상태 관리
 * - Routing: 질문 분석을 통한 적절한 노드로의 라우팅
 * - Tool-based Editing: 사용자 정보 편집을 위한 도구들
 * - Streaming: 실시간 결과 스트리밍
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
import "dotenv/config";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import {
  Annotation,
  Command,
  END,
  Messages,
  messagesStateReducer,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import * as fs from "fs";
import z from "zod";
import { convertAIChunkToAnswer, extractPrimaryContent } from "./utils";
import {
  EditAgeToolSchema,
  EditAgeToolSchemaType,
  EditGenderToolSchema,
  EditGenderToolSchemaType,
  EditUserNameToolSchema,
  EditUserNameToolSchemaType,
  routeSchema,
  RouteSchemaType,
  UserStateSchemaType,
} from "./types";
import {
  reactAgentPrompt,
  routePromptTemplate,
} from "./prompt/basic-state-prompt";

// Anthropic API 키 설정
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * 워크플로우의 상태를 정의하는 Annotation
 *
 * 각 필드는 그래프 실행 중에 유지되는 상태 정보를 나타냅니다:
 * - messages: 대화 메시지들의 배열
 * - question: 사용자의 질문
 * - userName, age, gender: 편집 가능한 사용자 정보
 * - route_to: 다음 실행할 노드 결정 ("edit" 또는 "answer")
 * - actLog: 실행된 작업들의 로그
 */
const BasicStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], Messages>({
    reducer: messagesStateReducer,
  }),
  question: Annotation<string>(),
  userName: Annotation<string>({
    value: (_current, update) => update,
    default: () => "",
  }),
  age: Annotation<number>({
    value: (_current, update) => update,
    default: () => 0,
  }),
  gender: Annotation<string>({
    value: (_current, update) => update,
    default: () => "",
  }),
  route_to: Annotation<"edit" | "answer">(),
  actLog: Annotation<ActLogSchemaType>({
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    default: () => [],
  }),
});

// Claude 3 Haiku 모델 설정
const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0.1,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
  streaming: true,
});

//=========================================================================================
// 노드 함수들 (Graph Nodes)
//=========================================================================================

/**
 * 일반적인 답변을 생성하는 노드
 *
 * 사용자 정보 편집이 필요하지 않은 경우 실행되며,
 * 기존 메시지들을 바탕으로 LLM이 답변을 생성합니다.
 *
 * @param state 현재 워크플로우 상태
 * @returns 생성된 답변 메시지
 */
const answerNode = async (state: typeof BasicStateAnnotation.State) => {
  const response = await llm.invoke(state.messages);

  return {
    messages: [response],
  };
};

/**
 * 라우팅 결정을 수행하는 노드
 *
 * 사용자의 질문을 분석하여 사용자 정보 편집이 필요한지 판단하고,
 * 적절한 다음 노드("edit" 또는 "answer")를 결정합니다.
 *
 * @param state 현재 워크플로우 상태
 * @returns 다음 실행할 노드 정보
 */
const routeNode = async (state: typeof BasicStateAnnotation.State) => {
  const chain = routePromptTemplate.pipe(
    llm.withStructuredOutput<RouteSchemaType>(routeSchema)
  );
  const result = await chain.invoke({
    question: state.question,
  });
  return {
    route_to: result.route,
  };
};

//=========================================================================================
// 도구들 (Tools) - 사용자 정보 편집을 위한 도구들
//=========================================================================================

/**
 * 사용자 이름을 변경하는 도구
 *
 * 상태의 userName을 업데이트하고 작업 로그를 기록합니다.
 * Command 객체를 반환하여 상태 업데이트를 수행합니다.
 */
const editUserNameTool = new DynamicStructuredTool<
  typeof EditUserNameToolSchema,
  EditUserNameToolSchemaType,
  string
>({
  name: "editUserName",
  description: "유저의 이름을 변경하는 도구",
  schema: EditUserNameToolSchema,
  func: async ({ userName }: EditUserNameToolSchemaType, _, config) => {
    const logs: ActLogSchemaType = [
      {
        act: "editUserName",
        data: userName,
      },
    ];
    return new Command({
      update: {
        userName: userName,
        messages: [
          new ToolMessage({
            content: userName,
            tool_call_id: (config as any)?.toolCall?.id ?? "",
            name: config?.runName,
          }),
        ],
        actLog: logs,
      },
    });
  },
});

/**
 * 사용자 나이를 변경하는 도구
 *
 * 상태의 age를 업데이트하고 작업 로그를 기록합니다.
 * Command 객체를 반환하여 상태 업데이트를 수행합니다.
 */
const editAgeTool = new DynamicStructuredTool<
  typeof EditAgeToolSchema,
  EditAgeToolSchemaType,
  string
>({
  name: "editAge",
  description: "유저의 나이를 변경하는 도구",
  schema: EditAgeToolSchema,
  func: async ({ age }: EditAgeToolSchemaType, _, config) => {
    const logs: ActLogSchemaType = [
      {
        act: "editAge",
        data: String(age),
      },
    ];
    return new Command({
      update: {
        age: age,
        messages: [
          new ToolMessage({
            content: String(age),
            tool_call_id: (config as any)?.toolCall?.id ?? "",
            name: config?.runName,
          }),
        ],
        actLog: logs,
      },
    });
  },
});

/**
 * 사용자 성별을 변경하는 도구
 *
 * 상태의 gender를 업데이트하고 작업 로그를 기록합니다.
 * Command 객체를 반환하여 상태 업데이트를 수행합니다.
 */
const editGenderTool = new DynamicStructuredTool<
  typeof EditGenderToolSchema,
  EditGenderToolSchemaType,
  string
>({
  name: "editGender",
  description: "유저의 성별을 변경하는 도구",
  schema: EditGenderToolSchema,
  func: async ({ gender }: EditGenderToolSchemaType, _, config) => {
    const logs: ActLogSchemaType = [
      {
        act: "editGender",
        data: gender,
      },
    ];
    return new Command({
      update: {
        gender: gender,
        messages: [
          new ToolMessage({
            content: gender,
            tool_call_id: (config as any)?.toolCall?.id ?? "",
            name: config?.runName,
          }),
        ],
        actLog: logs,
      },
    });
  },
});

// 편집 도구들을 하나의 노드로 결합
const toolNode = new ToolNode([
  editUserNameTool,
  editAgeTool,
  editGenderTool,
] as any);

/**
 * 작업 로그를 위한 Zod 스키마
 *
 * 각 편집 작업의 이력을 추적하기 위한 구조를 정의합니다.
 * - act: 수행된 작업 유형
 * - data: 작업에 사용된 데이터
 */
const ActLogSchema = z.array(
  z.object({
    act: z.enum(["editUserName", "editAge", "editGender"]),
    data: z.string(),
  })
);
type ActLogSchemaType = z.infer<typeof ActLogSchema>;

/**
 * 사용자 정보 편집을 수행하는 노드
 *
 * React Agent를 생성하여 사용자의 질문에 따라 적절한 편집 도구를 선택하고 실행합니다.
 * 현재 사용자 상태를 프롬프트에 포함하여 컨텍스트를 제공합니다.
 *
 * @param state 현재 워크플로우 상태
 * @returns 편집 결과가 반영된 상태
 */
const editNode = async (state: typeof BasicStateAnnotation.State) => {
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
    prompt: reactAgentPrompt(state.question, userState),
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

//=========================================================================================
// 메인 실행 함수
//=========================================================================================

/**
 * 워크플로우를 구성하고 실행하는 메인 함수
 *
 * 1. StateGraph를 구성하여 노드들과 엣지들을 연결
 * 2. 그래프를 컴파일하고 Mermaid 다이어그램 생성
 * 3. 테스트 질문으로 워크플로우 실행
 * 4. 스트리밍 모드로 결과를 실시간 출력
 */
const main = async () => {
  // 상태 그래프 구성
  const graph = new StateGraph(BasicStateAnnotation)
    .addNode("route", routeNode) // 라우팅 노드
    .addNode("edit", editNode) // 편집 노드
    .addNode("answer", answerNode) // 답변 노드
    .addEdge(START, "route") // 시작점에서 라우팅으로
    .addConditionalEdges(
      // 라우팅 결과에 따른 조건부 엣지
      "route",
      (state) => {
        return state["route_to"];
      },
      { answer: "answer", edit: "edit" }
    )
    .addEdge("edit", END) // 편집 완료 후 종료
    .addEdge("answer", END); // 답변 완료 후 종료

  // 그래프 컴파일
  const compiledGraph = graph.compile();

  // 그래프 구조를 Mermaid 다이어그램으로 저장
  const drawableGraph = await compiledGraph.getGraphAsync();
  const image = drawableGraph.drawMermaid();
  fs.writeFileSync("./mermaid/react-state-graph.mermaid", image);

  // 테스트용 질문
  const question = "내 이름을 김형진으로 변경해주고 나이는 24살로 변경해줘";

  // 워크플로우 초기 입력 상태
  const workflowInput: Partial<typeof BasicStateAnnotation.State> = {
    messages: [new HumanMessage(question)],
    question,
    userName: "",
    age: 0,
    gender: "",
    route_to: "answer",
  };

  // 스트리밍 모드로 워크플로우 실행
  let answerChunk: AIMessageChunk | undefined;
  for await (const chunk of await compiledGraph.stream(workflowInput, {
    streamMode: ["values", "messages"],
  })) {
    /*
    console.log(chunk);
    console.log("\n--------------------------------------------\n");
     */
    // 상태 값 변경사항 출력
    if (chunk[0] === "values") {
      console.log("-----values-----");
      answerChunk = undefined;
      console.log({
        ...chunk[1],
        messages: chunk[1].messages.map(extractPrimaryContent),
      });
      console.log("\n--------------------------------------------\n");
    }
    // 메시지 스트림 출력
    else if (chunk[0] === "messages") {
      const chunkMessage = chunk[1][0];
      if (chunkMessage.getType() === "ai") {
        if (answerChunk === undefined) {
          console.log("-----messages(answer)-----");
          answerChunk = chunkMessage as AIMessageChunk;
        } else answerChunk = answerChunk.concat(chunkMessage as AIMessageChunk);

        const answer = convertAIChunkToAnswer(answerChunk);
        if (answer !== "") console.log(answer);
      }
    }
  }
};

// 워크플로우 실행
void main();
