/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
import "dotenv/config";
import { ChatAnthropic } from "@langchain/anthropic";
import {
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
import { extractPrimaryContent } from "./utils";
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

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0.1,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
  streaming: true,
});

//------------------------------------------------------------------------------------------

const answerNode = async (state: typeof BasicStateAnnotation.State) => {
  const response = await llm.invoke(state.messages);

  return {
    messages: [response],
  };
};

//------------------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------------------

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

const toolNode = new ToolNode([
  editUserNameTool,
  editAgeTool,
  editGenderTool,
] as any);

const ActLogSchema = z.array(
  z.object({
    act: z.enum(["editUserName", "editAge", "editGender"]),
    data: z.string(),
  })
);
type ActLogSchemaType = z.infer<typeof ActLogSchema>;

const editNode = async (state: typeof BasicStateAnnotation.State) => {
  const userState: UserStateSchemaType = {
    userName: state.userName,
    age: state.age,
    gender: state.gender,
  };

  const agent = createReactAgent({
    tools: toolNode,
    llm: llm,
    prompt: reactAgentPrompt(state.question, userState),
    stateSchema: BasicStateAnnotation,
  });
  const result = await agent.invoke({
    messages: state.messages,
  });
  const messages = result.messages;
  return {
    messages: result.messages,
    userName: result.userName,
    age: result.age,
    gender: result.gender,
    actLog: result.actLog,
  };
};

//------------------------------------------------------------------------------------------

const main = async () => {
  const graph = new StateGraph(BasicStateAnnotation)
    .addNode("route", routeNode)
    .addNode("edit", editNode)
    .addNode("answer", answerNode)
    .addEdge(START, "route")
    .addConditionalEdges(
      "route",
      (state) => {
        return state["route_to"];
      },
      { answer: "answer", edit: "edit" }
    )
    .addEdge("edit", END)
    .addEdge("answer", END);

  const compiledGraph = graph.compile();

  //graph 구조 mermaid 파일로 저장
  const drawableGraph = await compiledGraph.getGraphAsync();
  const image = drawableGraph.drawMermaid();
  fs.writeFileSync("./mermaid/react-state-graph.mermaid", image);

  const question = "내 이름을 김형진으로 변경해주고 나이는 24살로 변경해줘";

  const workflowInput: Partial<typeof BasicStateAnnotation.State> = {
    messages: [new HumanMessage(question)],
    question,
    userName: "",
    age: 0,
    gender: "",
    route_to: "answer",
  };

  for await (const chunk of await compiledGraph.stream(workflowInput, {
    streamMode: ["values", "messages"],
  })) {
    // console.log(chunk);
    // console.log("\n--------------------------------------------\n");
    if (chunk[0] === "values") {
      console.log("-----values-----");
      console.log({
        ...chunk[1],
        messages: chunk[1].messages.map(extractPrimaryContent),
      });
      console.log("\n--------------------------------------------\n");
    } else if (chunk[0] === "messages") {
      console.log("-----messages-----");
      const target = chunk[1][0];
      console.log(extractPrimaryContent(target as BaseMessage));
      console.log("\n--------------------------------------------\n");
    }
  }
};

void main();
