import { z } from "zod";

export const EditUserNameToolSchema = z.object({
  userName: z.string(),
});
export type EditUserNameToolSchemaType = z.infer<typeof EditUserNameToolSchema>;
export const EditAgeToolSchema = z.object({
  age: z.number(),
});
export type EditAgeToolSchemaType = z.infer<typeof EditAgeToolSchema>;
export const EditGenderToolSchema = z.object({
  gender: z.string(),
});
export type EditGenderToolSchemaType = z.infer<typeof EditGenderToolSchema>;

export const routeSchema = z.object({
  route: z.enum(["edit", "answer"]),
});
export type RouteSchemaType = z.infer<typeof routeSchema>;

export const userStateSchema = z.object({
  userName: z.string(),
  age: z.number(),
  gender: z.string(),
});
export type UserStateSchemaType = z.infer<typeof userStateSchema>;

export const editRouteSchema = z.enum([
  "editUserName",
  "editAge",
  "editGender",
]);
export type EditRouteSchemaType = z.infer<typeof editRouteSchema>;

/**
 * 작업 로그를 위한 Zod 스키마
 *
 * 각 편집 작업의 이력을 추적하기 위한 구조를 정의합니다.
 * - act: 수행된 작업 유형
 * - data: 작업에 사용된 데이터
 */
export const ActLogSchema = z.array(
  z.object({
    act: z.enum(["editUserName", "editAge", "editGender"]),
    data: z.string(),
  })
);
export type ActLogSchemaType = z.infer<typeof ActLogSchema>;

export const TodoSchema = z.object({
  id: z.string(),
  content: z.string(),
  isDone: z.boolean(),
});

export const TodoListSchema = z.object({ todos: z.array(TodoSchema) });
export const RawTodoListSchema = z.object({
  todos: z.array(TodoSchema.omit({ id: true })),
});

export type TodoSchemaType = z.infer<typeof TodoSchema>;
export type TodoListSchemaType = z.infer<typeof TodoListSchema>;
export type RawTodoListSchemaType = z.infer<typeof RawTodoListSchema>;

export const UpdateTodoSchema = z.object({
  todos: z.array(
    z.object({
      id: z.string().describe("수정해야할 todo의 Id"),
      isDone: z.boolean().describe("수정해야할 todo의 isDone"),
    })
  ),
});
export type UpdateTodoSchemaType = z.infer<typeof UpdateTodoSchema>;
