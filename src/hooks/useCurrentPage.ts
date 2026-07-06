import { useEffect, useState } from "react";
import type { PageInfo } from "../types/page";
import { getPageInfo } from "../services/messaging";

export function useCurrentPage() {
  const [page, setPage] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        const data = await getPageInfo();
        setPage(data);
      } catch (err) {
  console.error(err);
  setError(
    err instanceof Error ? err.message : "Unable to read this page."
  );

      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, []);

  return {
    page,
    loading,
    error,
  };
}