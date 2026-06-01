import { useEffect, useRef } from "react";
import { env } from "../config/env";
import { EnrollmentCreatedEventData, EnrollmentCreatedEventMessage } from "../types/enrollmentRealtime";

function buildEnrollmentWsUrl(accessToken: string): string | null {
  if (!env.apiBaseUrl) {
    return null;
  }

  try {
    const apiUrl = new URL(env.apiBaseUrl);
    const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    const basePath = apiUrl.pathname.replace(/\/+$/, "");
    const wsPath = `${basePath}/ws/enrollments/`.replace(/\/{2,}/g, "/");
    const wsUrl = `${wsProtocol}//${apiUrl.host}${wsPath}?token=${encodeURIComponent(accessToken)}`;
    return wsUrl;
  } catch {
    return null;
  }
}

function isEnrollmentCreatedMessage(payload: unknown): payload is EnrollmentCreatedEventMessage {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybeMessage = payload as Partial<EnrollmentCreatedEventMessage>;
  return maybeMessage.event === "enrollment.created" && Boolean(maybeMessage.data);
}

export function useEnrollmentWebSocket(
  accessToken: string | null,
  onEnrollmentCreated: (item: EnrollmentCreatedEventData) => void
): void {
  const onEnrollmentCreatedRef = useRef(onEnrollmentCreated);

  useEffect(() => {
    onEnrollmentCreatedRef.current = onEnrollmentCreated;
  }, [onEnrollmentCreated]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const wsUrl = buildEnrollmentWsUrl(accessToken);
    if (!wsUrl) {
      return;
    }

    let stopped = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let retryAttempt = 0;

    const cleanupTimer = (): void => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = (): void => {
      if (stopped) {
        return;
      }

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        retryAttempt = 0;
      };

      socket.onmessage = (event) => {
        try {
          const payload: unknown = JSON.parse(event.data);
          if (isEnrollmentCreatedMessage(payload)) {
            onEnrollmentCreatedRef.current(payload.data);
          }
        } catch {
          // Ignore malformed messages and keep socket alive.
        }
      };

      socket.onclose = () => {
        if (stopped) {
          return;
        }

        const retryDelay = Math.min(30000, 1000 * 2 ** retryAttempt);
        retryAttempt += 1;
        reconnectTimer = window.setTimeout(connect, retryDelay);
      };
    };

    connect();

    return () => {
      stopped = true;
      cleanupTimer();
      socket?.close();
      socket = null;
    };
  }, [accessToken]);
}

