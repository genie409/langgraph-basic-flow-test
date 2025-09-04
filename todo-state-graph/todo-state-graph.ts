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
import {
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  END,
  Messages,
  messagesStateReducer,
  START,
  StateGraph,
} from "@langchain/langgraph";
import * as fs from "fs";
import {
  buildInitialState,
  convertAIChunkToAnswer,
  drawGraph,
  extractPrimaryContent,
} from "../utils";
import { ActLogSchemaType, TodoSchemaType } from "../types";
import { routeNode } from "./nodes/route.node";
import { answerNode } from "./nodes/answer.node";
import { editNode } from "./nodes/edit.node";
import { routeEdgeCondition } from "./edges/route.edge";
import { makeTodoNode } from "./nodes/make-todo.node";
import { updateTodoNode } from "./nodes/update-todo.node";
import { updateTodoEdgeCondition } from "./edges/update-todo.edge";

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
export const BasicStateAnnotation = Annotation.Root({
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
  todos: Annotation<TodoSchemaType[]>({
    value: (_current, update) => update,
    default: () => [],
  }),
});

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
    .addNode("makeTodo", makeTodoNode) // 투두 생성 노드
    .addNode("route", routeNode) // 라우팅 노드
    .addNode("edit", editNode) // 편집 노드
    .addNode("updateTodo", updateTodoNode) // 투두 업데이트 노드
    .addNode("answer", answerNode) // 답변 노드
    .addEdge(START, "makeTodo") // 시작점에서 투두 생성으로
    .addEdge("makeTodo", "route") // 투두 생성 후 라우팅으로
    .addConditionalEdges(
      // 라우팅 결과에 따른 조건부 엣지
      "route",
      routeEdgeCondition,
      { answer: "answer", edit: "edit" }
    )
    .addEdge("edit", "updateTodo") // 편집 완료 후 투두 업데이트로
    .addConditionalEdges("updateTodo", updateTodoEdgeCondition, {
      END: END,
      NEED_ACT: "route",
    }) // 투두 업데이트 완료 후 종료
    .addEdge("answer", END); // 답변 완료 후 종료

  const compiledGraph = graph.compile();

  drawGraph(compiledGraph, "todo-state-graph");

  // 테스트용 질문
  const question = "내 이름을 김형진으로 변경해주고 나이는 24살로 변경해줘";
  // 워크플로우 초기 입력 상태
  const workflowInput = buildInitialState(question);

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
