import { BasicStateAnnotation } from "../todo-state-graph";

export const updateTodoEdgeCondition = (
  state: typeof BasicStateAnnotation.State
) => {
  return state["todos"].every((todo) => todo.isDone) ? "END" : "NEED_ACT";
};
