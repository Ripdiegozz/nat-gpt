import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { ConversationItem } from "../conversation-item";

const baseConversation = {
  id: "conv-1",
  title: "Test Conversation",
  messages: [
    {
      id: "m1",
      content:
        "Hello there, this is a fairly long message to test preview truncation behavior in the item component",
      role: "user" as const,
      timestamp: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("ConversationItem", () => {
  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(
      <ConversationItem
        conversation={baseConversation}
        isActive={false}
        onSelect={onSelect}
        onDelete={() => {}}
      />
    );

    fireEvent.click(screen.getByText("Test Conversation"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("shows delete button on hover and calls onDelete without triggering onSelect", () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    render(
      <ConversationItem
        conversation={baseConversation}
        isActive={false}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    const container = screen
      .getByText("Test Conversation")
      .closest("div") as HTMLElement;
    fireEvent.mouseEnter(container);

    const deleteBtn = screen.getByRole("button", {
      name: /delete conversation/i,
    });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders collapsed variant with icon button", () => {
    const onSelect = vi.fn();
    render(
      <ConversationItem
        conversation={baseConversation}
        isActive={false}
        onSelect={onSelect}
        onDelete={() => {}}
        isCollapsed
      />
    );

    const btn = screen.getByRole("button", { name: /select conversation/i });
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalled();
  });
});
