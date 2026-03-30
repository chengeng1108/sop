import { ref, watch } from "vue";

export type PromptItem = {
  id: string;
  title: string;
  stage: string;
  content: string;
};

const STORAGE_KEY = "vibe_prompt_hub_v1";

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseStoredPrompts(raw: string | null): PromptItem[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const cleaned = parsed.filter(
      (item): item is PromptItem =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.stage === "string" &&
        typeof item.content === "string"
    );

    return cleaned;
  } catch {
    return null;
  }
}

export function usePrompts(seed: PromptItem[] = []) {
  const initial = parseStoredPrompts(localStorage.getItem(STORAGE_KEY)) ?? seed;
  const prompts = ref<PromptItem[]>(initial);

  watch(
    prompts,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    },
    { deep: true }
  );

  function upsertPrompt(input: Omit<PromptItem, "id"> & { id?: string }): PromptItem {
    const id = input.id ?? makeId();
    const payload: PromptItem = {
      id,
      title: input.title,
      stage: input.stage,
      content: input.content
    };

    const index = prompts.value.findIndex((item) => item.id === id);
    if (index === -1) {
      prompts.value.unshift(payload);
    } else {
      prompts.value[index] = payload;
    }

    return payload;
  }

  function removePrompt(id: string) {
    prompts.value = prompts.value.filter((item) => item.id !== id);
  }

  return {
    prompts,
    upsertPrompt,
    removePrompt
  };
}
