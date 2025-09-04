import { AIMessageChunk } from "@langchain/core/messages";
import type {
  AIMessage,
  BaseMessage,
  BaseMessageChunk,
  HumanMessage,
  MessageType,
  ToolMessage,
} from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import { StateType } from "@langchain/langgraph";

export const convertAIChunkToAnswer = (chunk: AIMessageChunk) => {
  const content = chunk.content;
  const answerContentText =
    typeof content === "string"
      ? content
      : content
          .map((part) => {
            if (typeof part === "string") return part;
            if (
              "text" in part &&
              typeof (part as { text?: unknown }).text === "string"
            ) {
              return (part as { text: string }).text;
            }
            return "";
          })
          .join("");

  return answerContentText;
};

interface PrimaryContent {
  type: MessageType;
  id: string | undefined;
  name: string;
  content: string;
  additional_kwargs: Record<string, unknown>;
  tool_calls?: ToolCall[];
}
export const extractPrimaryContent = (message: BaseMessage) => {
  const result: PrimaryContent = {
    type: message.getType(),
    id: message.id,
    name: message.name ?? "",
    content: JSON.stringify(message.content),
    additional_kwargs: message.additional_kwargs,
  };
  if (message.getType() === "ai") {
    result.tool_calls = (message as AIMessage).tool_calls;
  }
  return result;
};
