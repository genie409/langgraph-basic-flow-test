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
 * React Agent에서 사용되는 도구로, 사용자의 이름을 새로운 값으로 업데이트합니다.
 * LangGraph의 Command 패턴을 사용하여 상태를 안전하게 업데이트하고,
 * 수행된 작업을 로그에 기록합니다.
 *
 * 주요 기능:
 * - 워크플로우 상태의 userName 필드 업데이트
 * - 작업 실행 로그(actLog) 기록
 * - Tool 실행 결과를 메시지로 추가
 *
 * 사용 시나리오:
 * - "이름을 김철수로 바꿔줘" → userName: "김철수"로 변경
 * - "내 이름을 홍길동으로 변경해줘" → userName: "홍길동"으로 변경
 *
 * @param userName 변경할 새로운 사용자 이름
 * @returns Command 객체 (상태 업데이트 명령)
 */
export const editUserNameTool = new DynamicStructuredTool<
  typeof EditUserNameToolSchema,
  EditUserNameToolSchemaType,
  string
>({
  name: "editUserName", // Agent에서 참조할 도구 이름
  description: "유저의 이름을 변경하는 도구", // Agent가 도구 선택 시 참고할 설명
  schema: EditUserNameToolSchema, // 입력 파라미터 검증용 Zod 스키마
  func: async ({ userName }: EditUserNameToolSchemaType, _, config) => {
    // 작업 로그 생성: 어떤 작업을 수행했는지 기록
    const logs: ActLogSchemaType = [
      {
        act: "editUserName", // 수행된 작업 유형
        data: userName, // 작업에 사용된 데이터
      },
    ];

    // Command 패턴을 사용한 상태 업데이트
    // 이 방식은 상태 변경을 안전하고 추적 가능하게 만듭니다
    return new Command({
      update: {
        userName: userName, // 새로운 사용자 이름으로 상태 업데이트
        messages: [
          // 도구 실행 결과를 메시지로 추가
          new ToolMessage({
            content: userName, // 변경된 이름을 메시지 내용으로
            tool_call_id: (config as any)?.toolCall?.id ?? "", // 도구 호출 ID
            name: config?.runName, // 실행 이름
          }),
        ],
        actLog: logs, // 작업 로그를 상태에 추가
      },
    });
  },
});
