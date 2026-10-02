"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type AIEvent = {
  type: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  text?: string;
  error?: { message?: string };
  response?: {
    status?: string;
    status_details?: {
      error?: { message?: string };
    };
  };
};

export function useAssignmentAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [micOn, setMicOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const senderRef = useRef<RTCRtpSender | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const micBusyRef = useRef(false);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    const channel = channelRef.current;
    channelRef.current = null;
    channel?.close();

    const peer = peerRef.current;
    peerRef.current = null;
    peer?.close();

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    senderRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }

    busyRef.current = false;
    setBusy(false);
    setMicOn(false);
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  function updateMessage(
    id: string,
    role: Message["role"],
    text: string,
    append = false
  ) {
    setMessages((current) => {
      const found = current.some((message) => message.id === id);

      if (!found) {
        return [...current, { id, role, text }];
      }

      return current.map((message) =>
        message.id === id
          ? {
              ...message,
              text: append ? message.text + text : text,
            }
          : message
      );
    });
  }

  function handleEvent(event: AIEvent) {
    if (event.type === "input_audio_buffer.speech_started") {
      busyRef.current = true;
      setBusy(true);

      if (event.item_id) {
        updateMessage(event.item_id, "user", "音声を聞き取り中…");
      }
    }

    if (
      event.type === "conversation.item.input_audio_transcription.completed" &&
      event.item_id
    ) {
      updateMessage(
        event.item_id,
        "user",
        event.transcript || "（音声入力）"
      );
    }

    if (
      event.type === "conversation.item.input_audio_transcription.failed" &&
      event.item_id
    ) {
      updateMessage(event.item_id, "user", "（文字起こしできませんでした）");
    }

    if (event.type === "response.created") {
      busyRef.current = true;
      setBusy(true);
    }

    if (
      (event.type === "response.output_text.delta" ||
        event.type === "response.output_audio_transcript.delta") &&
      event.item_id
    ) {
      updateMessage(
        event.item_id,
        "assistant",
        event.delta || "",
        true
      );
    }

    if (
      (event.type === "response.output_text.done" ||
        event.type === "response.output_audio_transcript.done") &&
      event.item_id
    ) {
      updateMessage(
        event.item_id,
        "assistant",
        event.text ?? event.transcript ?? ""
      );
    }

    if (event.type === "response.done") {
      busyRef.current = false;
      setBusy(false);

      if (event.response?.status === "failed") {
        setError(
          event.response.status_details?.error?.message ||
            "AIの返答に失敗しました。"
        );
      }
    }

    if (event.type === "error") {
      busyRef.current = false;
      setBusy(false);
      setError(event.error?.message || "会話中にエラーが発生しました。");
    }
  }

  async function connect() {
    if (abortRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setError("");
    setMessages([]);
    setStatus("connecting");

    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 30_000);

    try {
      const { data, error: authError } = await supabase.auth.getSession();

      if (controller.signal.aborted) {
        throw new Error("接続を中止しました。");
      }

      if (authError || !data.session) {
        throw new Error("ログインし直してください。");
      }

      const tokenResponse = await fetch(
        "/api/admin/assignment-ai/session",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
          signal: controller.signal,
        }
      );

      const token = await tokenResponse.json();

      if (!tokenResponse.ok || !token.value) {
        throw new Error(token.error || "AIに接続できませんでした。");
      }

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;

      peer.ontrack = (event) => {
        if (peerRef.current !== peer) return;
        audio.srcObject =
          event.streams[0] || new MediaStream([event.track]);
      };

      // 最初はマイクを使わず、文字だけでも会話できるようにします。
      const transceiver = peer.addTransceiver("audio", {
        direction: "sendrecv",
      });
      senderRef.current = transceiver.sender;

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;

      channel.onmessage = (message) => {
        if (peerRef.current !== peer) return;

        try {
          handleEvent(JSON.parse(message.data) as AIEvent);
        } catch {
          setError("AIの返答を読み取れませんでした。");
        }
      };

      channel.onclose = () => {
        if (peerRef.current !== peer) return;
        disconnect();
        setError("接続が終了しました。再接続すると新しい会話になります。");
      };

      peer.onconnectionstatechange = () => {
        if (peerRef.current !== peer) return;

        if (peer.connectionState === "failed") {
          disconnect();
          setError("通信が切れました。もう一度接続してください。");
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const response = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.value}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error("音声会話への接続に失敗しました。");
      }

      await peer.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });

      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          reject(new Error("接続がタイムアウトしました。"));
        };

        if (controller.signal.aborted) {
          onAbort();
          return;
        }

        controller.signal.addEventListener("abort", onAbort, {
          once: true,
        });

        const ready = () => {
          controller.signal.removeEventListener("abort", onAbort);
          resolve();
        };

        if (channel.readyState === "open") {
          ready();
        } else {
          channel.addEventListener("open", ready, { once: true });
        }
      });

      if (controller.signal.aborted || peerRef.current !== peer) return;

      channel.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            audio: {
              input: {
                transcription: {
                  model: "gpt-4o-mini-transcribe",
                  language: "ja",
                },
              },
            },
          },
        })
      );

      setStatus("connected");
    } catch (cause) {
      if (abortRef.current !== controller) return;

      disconnect();
      setError(
        controller.signal.aborted
          ? "接続がタイムアウトしました。もう一度お試しください。"
          : cause instanceof Error
            ? cause.message
            : "接続に失敗しました。"
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function sendText(text: string) {
    const channel = channelRef.current;
    const value = text.trim();

    if (!value || channel?.readyState !== "open" || busyRef.current) {
      return false;
    }

    setError("");

    const id = crypto.randomUUID();
    const voiceEnabled = Boolean(streamRef.current);

    try {
      channel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            id,
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: value }],
          },
        })
      );

      channel.send(
        JSON.stringify({
          type: "response.create",
          response: {
            output_modalities: voiceEnabled ? ["audio"] : ["text"],
          },
        })
      );

      updateMessage(id, "user", value);
      busyRef.current = true;
      setBusy(true);
      return true;
    } catch {
      setError("送信できませんでした。接続を確認してください。");
      return false;
    }
  }

  async function toggleMic() {
    const peer = peerRef.current;
    const sender = senderRef.current;

    if (!peer || !sender || micBusyRef.current || status !== "connected") {
      return;
    }

    micBusyRef.current = true;
    setError("");

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setMicOn(false);
        await sender.replaceTrack(null);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (peerRef.current !== peer) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      await sender.replaceTrack(stream.getAudioTracks()[0]);

      if (peerRef.current !== peer) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setMicOn(true);

      if (audioRef.current?.srcObject) {
        await audioRef.current.play().catch(() => {
          setError("音声を再生できません。端末の音声設定を確認してください。");
        });
      }
    } catch {
      if (peerRef.current === peer) {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setMicOn(false);
        setError("マイクを使用できません。ブラウザのマイク許可を確認してください。");
      }
    } finally {
      micBusyRef.current = false;
    }
  }

  return {
    messages,
    status,
    micOn,
    busy,
    error,
    connect,
    disconnect,
    sendText,
    toggleMic,
  };
}