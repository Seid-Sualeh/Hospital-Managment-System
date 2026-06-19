import { useState, useCallback } from "react";

const useAiPanel = () => {
  const [content, setContent] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extra, setExtra] = useState(null);

  const run = useCallback(async (requestFn) => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestFn();
      const data = res?.data?.data || res?.data || res;
      const text =
        data?.summary_draft ||
        data?.summary ||
        data?.support ||
        data?.assistance ||
        data?.analysis ||
        data?.insight ||
        data?.insights ||
        data?.explanation_draft ||
        data?.interaction_draft ||
        data?.suggestion ||
        "";
      setContent(text);
      setSections(data?.sections || []);
      setExtra(data);
      return data;
    } catch (err) {
      const msg = err.apiError?.message || err.message || "AI request failed.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setContent("");
    setSections([]);
    setError(null);
    setExtra(null);
  }, []);

  return { content, sections, loading, error, extra, run, reset, setContent };
};

export default useAiPanel;
