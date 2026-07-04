// app/(system)/admin/assignments/month/hooks/useAssignmentEditPresence.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type PresencePayload = {
  userId: string;
  userName: string;
  cellKey: string;
  startedAt: string;
};

type Props = {
  organizationId: string;
  userId: string;
  userName: string;
};

export function useAssignmentEditPresence({
  organizationId,
  userId,
  userName,
}: Props) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [presenceState, setPresenceState] = useState<
    Record<string, PresencePayload[]>
  >({});
  const [currentCellKey, setCurrentCellKey] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId || !userId || !userName) return;

    const channel = supabase.channel(
      `assignment-edit-presence-${organizationId}`,
      {
        config: {
          presence: {
            key: userId,
          },
        },
      }
    );

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        const nextState: Record<string, PresencePayload[]> = {};

        Object.values(state).forEach((entries) => {
          entries.forEach((entry) => {
            if (!entry.cellKey) return;

            if (!nextState[entry.cellKey]) {
              nextState[entry.cellKey] = [];
            }

            nextState[entry.cellKey].push(entry);
          });
        });

        setPresenceState(nextState);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        if (!currentCellKey) return;

        await channel.track({
          userId,
          userName,
          cellKey: currentCellKey,
          startedAt: new Date().toISOString(),
        });
      });

    channelRef.current = channel;

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
    };
  }, [organizationId, userId, userName, currentCellKey]);

  const startEditing = async (cellKey: string) => {
    setCurrentCellKey(cellKey);

    const channel = channelRef.current;
    if (!channel) return;

    await channel.track({
      userId,
      userName,
      cellKey,
      startedAt: new Date().toISOString(),
    });
  };

  const stopEditing = async (cellKey?: string) => {
    const channel = channelRef.current;

    if (!channel) {
      setCurrentCellKey(null);
      return;
    }

    if (cellKey && currentCellKey !== cellKey) {
      return;
    }

    setCurrentCellKey(null);
    await channel.untrack();
  };

  const getEditingUsers = (cellKey: string) => {
    return (presenceState[cellKey] ?? []).filter((entry) => entry.userId !== userId);
  };

  const editingUsersByCell = useMemo(() => presenceState, [presenceState]);

  return {
    currentCellKey,
    editingUsersByCell,
    getEditingUsers,
    startEditing,
    stopEditing,
  };
}