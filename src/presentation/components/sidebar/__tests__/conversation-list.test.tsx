import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConversationList } from "../conversation-list";
import type { ConversationDTO } from "@/application/dtos/conversation.dto";

const makeConversation = (
  id: string,
  title = `Conv ${id}`,
  messages: number = 1
): ConversationDTO => ({
  id,
  title,
  messages: Array.from({ length: messages }).map((_, i) => ({
    id: `${id}-m${i + 1}`,
    content: `Message ${i + 1}`,
    role: "user",
    timestamp: new Date().toISOString(),
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe("ConversationList", () => {
  it("renders empty state when no conversations and not collapsed", () => {
    render(
      <ConversationList
        conversations={[]}
        activeConversationId={null}
        onConversationSelect={() => {}}
        onConversationDelete={() => {}}
      />
    );

    expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
  });

  it("renders items and handles select and delete", () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const conversations = [makeConversation("1"), makeConversation("2")];

    render(
      <ConversationList
        conversations={conversations}
        activeConversationId={"1"}
        onConversationSelect={onSelect}
        onConversationDelete={onDelete}
      />
    );

    // Click second item title to select
    fireEvent.click(screen.getByText("Conv 2"));
    expect(onSelect).toHaveBeenCalledWith("2");

    // Hover to reveal delete and click it for first item
    const firstItemTitle = screen.getByText("Conv 1");
    const itemContainer = firstItemTitle.closest("div") as HTMLElement;
    fireEvent.mouseEnter(itemContainer);

    const deleteBtn = screen.getAllByRole("button", {
      name: /delete conversation/i,
    })[0];
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("renders collapsed items as icon buttons when isCollapsed", () => {
    const conversations = [makeConversation("1")];

    render(
      <ConversationList
        conversations={conversations}
        activeConversationId={null}
        onConversationSelect={() => {}}
        onConversationDelete={() => {}}
        isCollapsed
      />
    );

    expect(
      screen.getByRole("button", { name: /select conversation/i })
    ).toBeInTheDocument();
  });
});
