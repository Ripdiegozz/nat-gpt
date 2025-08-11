import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageInput } from "../message-input";

describe("MessageInput", () => {
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  it("renders input field and send button", () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    expect(
      screen.getByPlaceholderText("Type your message...")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
  });

  it("shows placeholder text", () => {
    render(
      <MessageInput
        onSendMessage={mockOnSendMessage}
        placeholder="Custom placeholder"
      />
    );

    expect(
      screen.getByPlaceholderText("Custom placeholder")
    ).toBeInTheDocument();
  });

  it("calls onSendMessage when send button is clicked", async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText("Type your message...");
    const sendButton = screen.getByLabelText("Send message");

    await user.type(input, "Hello world");
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith("Hello world");
  });

  it("calls onSendMessage when Enter is pressed", async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText("Type your message...");

    await user.type(input, "Hello world");
    await user.keyboard("{Enter}");

    expect(mockOnSendMessage).toHaveBeenCalledWith("Hello world");
  });

  it("does not send message when Shift+Enter is pressed", async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText("Type your message...");

    await user.type(input, "Hello world");
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it("disables send button when message is empty", () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const sendButton = screen.getByLabelText("Send message");
    expect(sendButton).toBeDisabled();
  });

  it("disables send button when message is only whitespace", async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText("Type your message...");
    const sendButton = screen.getByLabelText("Send message");

    await user.type(input, "   ");
    expect(sendButton).toBeDisabled();
  });

  it("enables send button when message has content", async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText("Type your message...");
    const sendButton = screen.getByLabelText("Send message");

    await user.type(input, "Hello");
    expect(sendButton).not.toBeDisabled();
  });

  it("disables input when disabled prop is true", () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);

    const input = screen.getByPlaceholderText("Type your message...");
    const sendButton = screen.getByLabelText("Send message");

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it("clears input after successful send", async () => {
    const user = userEvent.setup();

    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText(
      "Type your message..."
    ) as HTMLTextAreaElement;
    const sendButton = screen.getByLabelText("Send message");

    await user.type(input, "Hello world");
    await user.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("shows keyboard shortcuts help text", () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);

    expect(
      screen.getByText(/Enter to send, Shift\+Enter for new line/)
    ).toBeInTheDocument();
  });
});
