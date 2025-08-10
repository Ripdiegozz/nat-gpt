import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useChatModule from "../../../hooks/use-chat";
import { ChatInterface } from "../chat-interface";

vi.mock("../sidebar", () => ({
  Sidebar: ({ className }: { className?: string }) => (
    <div className={className} aria-label="Conversations sidebar" />
  ),
}));

function mockUseChat(
  overrides: Partial<ReturnType<typeof useChatModule.useChat>> = {}
) {
  const base: ReturnType<typeof useChatModule.useChat> = {
    activeConversationId: null,
    activeConversation: null,
    conversations: [],
    isLoadingConversations: false,
    conversationsError: null,
    refreshConversations: vi.fn(),
    setActiveConversation: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue(true),
    isSendingMessage: false,
    sendMessageError: null,
    createNewConversation: vi.fn().mockResolvedValue(true),
    isCreatingConversation: false,
    createConversationError: null,
    deleteConversation: vi.fn().mockResolvedValue(true),
    isDeletingConversation: false,
    clearAllErrors: vi.fn(),
  };
  vi.spyOn(useChatModule, "useChat").mockReturnValue({ ...base, ...overrides });
}

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Make window width desktop by default
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      writable: true,
    });
  });

  it("renders header title and new chat button", () => {
    mockUseChat();
    render(<ChatInterface />);

    expect(
      screen.getByRole("heading", { name: /NatGPT Chat/i })
    ).toBeInTheDocument();
    // Two buttons share the same accessible name (sidebar & header); assert at least one exists
    expect(
      screen.getAllByRole("button", { name: /start new conversation/i }).length
    ).toBeGreaterThan(0);
  });

  it("opens sidebar when toggle is clicked", async () => {
    mockUseChat();
    render(<ChatInterface />);

    // Sidebar starts open on desktop. Close it by simulating state via click on overlay? Instead, toggle by clicking button only visible when closed.
    // Close by forcing state through resize below 768, which auto-closes on mount.
    Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
    window.dispatchEvent(new Event("resize"));

    // Sidebar closed, open button visible (wait for state update)
    const openBtn = await screen.findByRole("button", {
      name: /open sidebar/i,
    });
    fireEvent.click(openBtn);

    // Sidebar container is present and labeled
    expect(screen.getByLabelText("Conversations sidebar")).toBeInTheDocument();
  });

  it("shows inline error alert when there is an error", () => {
    mockUseChat({ conversationsError: "Failed to load" });
    render(<ChatInterface />);

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load");
  });

  it("sends a message through the input", async () => {
    const sendMessage = vi.fn().mockResolvedValue(true);
    mockUseChat({
      activeConversationId: "1",
      activeConversation: {
        id: "1",
        title: "A",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      sendMessage,
    });
    render(<ChatInterface />);

    const input = screen.getByPlaceholderText(/Type your message/);
    await fireEvent.change(input, { target: { value: "Hello" } });

    const sendBtn = screen.getByLabelText(/send message/i);
    fireEvent.click(sendBtn);

    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
  });
});
