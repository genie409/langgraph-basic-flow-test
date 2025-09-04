import { DynamicStructuredTool } from "@langchain/community/tools/dynamic";
import { Command } from "@langchain/langgraph/web";
import {
  ActLogSchemaType,
  EditUserNameToolSchema,
  EditUserNameToolSchemaType,
} from "../../../types";
import { ToolMessage } from "@langchain/core/messages";

/**
 * 사용자 이름을 변경하는 도구
 *
 * 상태의 userName을 업데이트하고 작업 로그를 기록합니다.
 * Command 객체를 반환하여 상태 업데이트를 수행합니다.
 */
export const editUserNameTool = new DynamicStructuredTool<
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
