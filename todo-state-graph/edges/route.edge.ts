import { BasicStateAnnotation } from "../todo-state-graph";

export const routeEdgeCondition = (
  state: typeof BasicStateAnnotation.State
) => {
  return state["route_to"];
};
