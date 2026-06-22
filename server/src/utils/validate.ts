import { ZodSchema } from "zod";

export function parseOrThrow<T>(schema: ZodSchema<T>, input: unknown): T {
    const r = schema.safeParse(input);
    if (!r.success) {
        const msg = r.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error(msg);
    }
    return r.data;
}
