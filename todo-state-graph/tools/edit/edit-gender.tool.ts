import { Command } from "@langchain/langgraph/web";
import {
  ActLogSchemaType,
  EditGenderToolSchema,
  EditGenderToolSchemaType,
} from "../../../types";
import { DynamicStructuredTool } from "@langchain/community/tools/dynamic";
import { ToolMessage } from "@langchain/core/messages";

/**
 * 사용자 성별을 변경하는 도구
 *
 * 상태의 gender를 업데이트하고 작업 로그를 기록합니다.
 * Command 객체를 반환하여 상태 업데이트를 수행합니다.
 */
export const editGenderTool = new DynamicStructuredTool<
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
