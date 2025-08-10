export class ConversationId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ConversationId cannot be empty');
    }
    this.value = value.trim();
  }

  toString(): string {
    return this.value;
  }

  equals(other: ConversationId): boolean {
    return this.value === other.value;
  }

  static generate(): ConversationId {
    return new ConversationId(crypto.randomUUID());
  }
}