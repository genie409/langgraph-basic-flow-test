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
