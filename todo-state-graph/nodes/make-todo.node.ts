import { ChatAnthropic } from "@langchain/anthropic";
import { makeTodoPrompt } from "../prompt/make-todo.prompt";
import { BasicStateAnnotation } from "../todo-state-graph";
import { RawTodoListSchema, RawTodoListSchemaType } from "../../types";
import { v4 as uuidv4 } from "uuid";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0.1,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
  streaming: true,
});

export const makeTodoNode = async (
  state: typeof BasicStateAnnotation.State
) => {
  const chain = makeTodoPrompt.pipe(
    llm.withStructuredOutput<RawTodoListSchemaType>(RawTodoListSchema)
  );
  const result = await chain.invoke({
    question: state.question,
  });
  return {
    todos: result.todos.map((todo) => ({
      ...todo,
      id: uuidv4(),
    })),
  };
};
