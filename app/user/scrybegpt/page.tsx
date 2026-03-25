"use client"

import type React from "react"
import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DefaultChatTransport } from "ai"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useSubscriptionGuard } from "@/hooks/use-subscription-guard"

const SUGGESTIONS = [
  "Who do I have today?",
  "How many patients do I have?",
  "Show me this week's schedule",
  "How much did I make today?",
]

export default function ScrybeGPTPage() {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { requireSubscription } = useSubscriptionGuard()

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/scrybegpt" }),
    []
  )

  const { messages, sendMessage, status } = useChat({ transport })

  const uniqueMessages = useMemo(() => {
    const seen = new Map()
    return messages.filter((message) => {
      if (seen.has(message.id)) return false
      seen.set(message.id, true)
      return true
    })
  }, [messages])

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [uniqueMessages.length])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      if (!requireSubscription("use ScrybeGPT")) return
      sendMessage({ text: input })
      setInput("")
    },
    [input, isLoading, sendMessage, requireSubscription]
  )

  const handleSuggestion = useCallback(
    (text: string) => {
      if (!requireSubscription("use ScrybeGPT")) return
      sendMessage({ text })
    },
    [sendMessage, requireSubscription]
  )

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">ScrybeGPT</h1>
          <p className="text-xs text-muted-foreground">
            Ask about patients, schedule, revenue, or anything clinical
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          {uniqueMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">
                  Welcome to ScrybeGPT
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Your AI medical assistant. Ask about patients, check your
                  schedule, get clinical support, or track revenue.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-left h-auto py-2 px-3 text-xs whitespace-normal"
                    onClick={() => handleSuggestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {uniqueMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.parts
                        ?.filter((p) => p.type === "text")
                        .map((p) => (p as any).text)
                        .join("") || ""}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">
                    {message.parts
                      ?.filter((p) => p.type === "text")
                      .map((p) => (p as any).text)
                      .join("") || ""}
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && uniqueMessages[uniqueMessages.length - 1]?.role === "user" && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ScrybeGPT anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
