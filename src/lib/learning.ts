export const courseKey = (c: { title: string; provider: string }) => `course:${c.title}|${c.provider}`;
export const certKey = (c: { name: string }) => `cert:${c.name}`;
