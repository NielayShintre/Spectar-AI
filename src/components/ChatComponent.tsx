"use client";
import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send, History } from "lucide-react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Message } from "ai";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Props = { chatId: number };

const ChatComponent = ({ chatId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {
        chatId,
      });
      return response.data;
    },
  });

  const [messages, setMessages] = useState<Message[]>(data || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    const newMessage: Message = { id: uuidv4(), role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [...messages, newMessage], chatId }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedResponse = "";

    if (reader) {
      const assistantMessageId = uuidv4();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedResponse }
              : msg
          )
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-gray-50">
      {/* header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <h3 className="text-xl font-bold text-gray-800">Chat</h3>
        </div>
      </div>

      {/* message container */}
      <div className="flex-1 overflow-y-auto px-4 pb-20" id="message-container">
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full space-y-3 text-gray-500">
            <History className="h-8 w-8" />
            <p className="text-lg">No message history yet</p>
          </div>
        ) : (
          <div className="py-4">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
        )}
      </div>

      {/* input form - fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="max-w-[850px] mx-auto">
          <div className="flex items-center gap-2 p-3">
            <div className="flex-1 flex items-center">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask any question..."
                className="w-full h-10"
              />
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 h-10 w-11 p-0 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
