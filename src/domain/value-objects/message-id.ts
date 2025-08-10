export class MessageId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('MessageId cannot be empty');
    }
    this.value = value.trim();
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }

  static generate(): MessageId {
    return new MessageId(crypto.randomUUID());
  }
}