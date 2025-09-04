import { ChatAnthropic } from "@langchain/anthropic";
import { BasicStateAnnotation } from "../todo-state-graph";
import { UpdateTodoSchema, UpdateTodoSchemaType } from "../../types";
import { updateTodoPrompt } from "../prompt/update-todo.prompt";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0.1,
  maxTokens: 1000,
  apiKey: ANTHROPIC_API_KEY,
  streaming: true,
});

export const updateTodoNode = async (
  state: typeof BasicStateAnnotation.State
) => {
  const chain = updateTodoPrompt.pipe(
    llm.withStructuredOutput<UpdateTodoSchemaType>(UpdateTodoSchema)
  );
  const result = await chain.invoke({
    history: state.messages,
    question: state.question,
    todos: JSON.stringify(state.todos),
    actLog: JSON.stringify(state.actLog),
  });

  console.log("update todo list", result.todos);

  const newTodos = state.todos.map((todo) => {
    const updateTodo = result.todos.find((t) => t.id === todo.id);
    if (updateTodo) {
      return {
        ...todo,
        isDone: updateTodo.isDone,
      };
    }
    return todo;
  });
  return {
    todos: newTodos,
  };
};
