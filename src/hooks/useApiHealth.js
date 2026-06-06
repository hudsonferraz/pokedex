import { useCallback, useEffect, useState } from "react";
import { fetchApiHealth, isApiUrlConfigured } from "../services/apiHealthService";

const RETRY_DELAYS_MS = [0, 3000, 8000];

/**
 * Polls GET /health with retries (Render cold starts).
 * @returns {{ status: 'loading'|'connected'|'offline'|'local-only', aiConfigured: boolean, retry: () => void }}
 */
export function useApiHealth() {
  const [status, setStatus] = useState("loading");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isApiUrlConfigured()) {
      setStatus("local-only");
      setAiConfigured(false);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setStatus("loading");

      for (let index = 0; index < RETRY_DELAYS_MS.length; index += 1) {
        if (cancelled) return;

        if (RETRY_DELAYS_MS[index] > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, RETRY_DELAYS_MS[index]);
          });
        }

        if (cancelled) return;

        try {
          const health = await fetchApiHealth(controller.signal);
          if (cancelled) return;

          if (health) {
            setStatus("connected");
            setAiConfigured(health.aiTipsConfigured);
            return;
          }
        } catch {
          if (cancelled) return;
        }
      }

      if (!cancelled) {
        setStatus("offline");
        setAiConfigured(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { status, aiConfigured, retry };
}
