import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "../sidebar";
import * as hooks from "../../../hooks";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockConversations = [
  {
    id: "1",
    title: "First",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Second",
    messages: [
      {
        id: "m1",
        content: "Hello",
        role: "user" as const,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("Sidebar", () => {
  beforeEach(() => {
    vi.spyOn(hooks, "useConversations").mockReturnValue({
      conversations: mockConversations,
      isLoading: false,
      error: null,
      deleteConversation: vi.fn().mockResolvedValue(true),
      refreshConversations: vi.fn(),
      isDeleting: false,
      clearError: vi.fn(),
    });

    vi.spyOn(hooks, "useCreateConversation").mockReturnValue({
      createConversation: vi
        .fn()
        .mockResolvedValue({ conversation: mockConversations[0] }),
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });
  });

  it("renders header and list", () => {
    render(
      <Sidebar activeConversationId={null} onConversationSelect={() => {}} />
    );

    // Header title
    expect(screen.getAllByText(/Conversations/i)[0]).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("creates new conversation when button clicked", async () => {
    const onSelect = vi.fn();
    render(
      <Sidebar activeConversationId={null} onConversationSelect={onSelect} />
    );

    const btn = screen.getByRole("button", {
      name: /start new conversation|new chat/i,
    });
    await fireEvent.click(btn);

    expect(onSelect).toHaveBeenCalled();
  });

  it("calls onConversationSelect when item is clicked", () => {
    const onSelect = vi.fn();
    render(
      <Sidebar activeConversationId={null} onConversationSelect={onSelect} />
    );

    fireEvent.click(screen.getByText("Second"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("supports mobile close on select", async () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <Sidebar
        activeConversationId={null}
        onConversationSelect={onSelect}
        isMobile
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText("Second"));
    expect(onSelect).toHaveBeenCalledWith("2");
    expect(onClose).toHaveBeenCalled();
  });
});
