"use client";

import { useEffect, useRef, useCallback } from "react";
import type { SSEEvent, SSEEventType } from "@/lib/sse";

type Handler = (event: SSEEvent) => void;

/**
 * useSSE — connects to /api/events and dispatches typed events to handlers.
 * Automatically reconnects on disconnect with exponential backoff.
 */
export function useSSE(handlers: Partial<Record<SSEEventType | "all", Handler>>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const es = new EventSource("/api/events");
    let reconnectDelay = 1000;

    const eventTypes: SSEEventType[] = [
      "application_status_changed",
      "document_verified",
      "permit_issued",
      "notification",
      "heartbeat",
    ];

    eventTypes.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const parsed: SSEEvent = JSON.parse(e.data);
          handlersRef.current[type]?.(parsed);
          handlersRef.current["all"]?.(parsed);
        } catch {
          // ignore malformed events
        }
      });
    });

    es.onerror = () => {
      es.close();
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };

    return es;
  }, []);

  useEffect(() => {
    const es = connect();
    return () => es.close();
  }, [connect]);
}
