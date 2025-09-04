import { Command } from "@langchain/langgraph/web";
import {
  ActLogSchemaType,
  EditAgeToolSchema,
  EditAgeToolSchemaType,
} from "../../../types";
import { DynamicStructuredTool } from "@langchain/community/tools/dynamic";
import { ToolMessage } from "@langchain/core/messages";

/**
 * 사용자 나이를 변경하는 도구
 *
 * 상태의 age를 업데이트하고 작업 로그를 기록합니다.
 * Command 객체를 반환하여 상태 업데이트를 수행합니다.
 */
export const editAgeTool = new DynamicStructuredTool<
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
