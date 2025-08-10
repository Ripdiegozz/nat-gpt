export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export const isValidMessageRole = (role: string): role is MessageRole => {
  return Object.values(MessageRole).includes(role as MessageRole);
};