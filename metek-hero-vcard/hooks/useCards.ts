import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { cardService } from "../services/cardService";
import type { VCard } from "../shared/schema";
export function useCards() {
  const [cards, setCards] = useState<VCard[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCards(await cardService.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kartlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  return { cards, loading, error, reload };
}
