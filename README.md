### basic-react-tool.ts

- **역할**: 곱셈 도구를 가진 ReAct 에이전트를 생성해 단일 호출(`invoke`)로 결과를 반환합니다.
- **구조**:
  - Zod로 `MultiplyToolSchema` 정의 → `DynamicStructuredTool` 생성 → `ToolNode` 구성
  - `ChatAnthropic` LLM 설정 → `createReactAgent({ llm, tools })`
  - `HumanMessage` 배열을 입력으로 `agent.invoke({ messages })` 호출 → 결과 출력
- **실행**:

```bash
npx tsx basic-react-tool.ts
```

### basic-react-stream.ts

- **역할**: 위와 동일한 곱셈 도구 기반 ReAct 에이전트지만, 스트리밍으로 토큰을 받아가며 출력합니다.
- **구조**:
  - 도구/에이전트 구성은 동일
  - `agent.stream({ messages }, { streamMode: ["values", "messages"] })` 사용
  - `AIMessageChunk`를 누적해 `utils.convertAIChunkToAnswer`로 텍스트 병합 후 실시간 출력
- **실행**:

```bash
npx tsx basic-react-stream.ts
```

### react-state-graph.ts

- **역할**: `StateGraph`로 `route → (edit|answer) → END` 플로우를 구성하고, 실행 시 Mermaid 소스 파일을 생성합니다.
- **구조**:
  - `BasicStateAnnotation`: 메시지/질문/유저 상태(`userName`, `age`, `gender`)/`route_to`/`actLog` 정의
  - 노드
    - `routeNode`: `routePromptTemplate` + `withStructuredOutput(routeSchema)`로 `edit|answer` 결정
    - `editNode`: `createReactAgent`로 편집 툴(`editUserName|editAge|editGender`) 실행, `Command`로 상태 업데이트 반환
    - `answerNode`: LLM 응답 생성
  - 그래프
    - `START → route → (answer|edit) → END`, `addConditionalEdges`로 분기
    - `compile()` 후 `getGraphAsync().drawMermaid()`로 `mermaid/react-state-graph.mermaid` 저장
    - `compiledGraph.stream(input, { streamMode: ["values", "messages"] })`로 진행 상황/메시지 출력
- **실행**:

```bash
npx tsx react-state-graph.ts
```
