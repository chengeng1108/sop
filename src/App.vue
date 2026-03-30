<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { type PromptItem, usePrompts } from "./usePrompts";

const stageOptions = [
  "0%-20% 概念期",
  "20%-40% 需求期",
  "40%-60% 方案期",
  "60%-80% 开发期",
  "80%-100% 部署期"
];

const seedPrompts: PromptItem[] = [
  {
    id: "seed-1",
    title: "概念校准提示词",
    stage: "0%-20% 概念期",
    content:
      "你是产品合伙人。先复述我当前想做的工具，再用一句话定义目标用户，最后列出 3 条必须达成的结果标准。"
  },
  {
    id: "seed-2",
    title: "需求拆解提示词",
    stage: "20%-40% 需求期",
    content:
      "把需求拆成输入、操作、输出三部分。每部分不超过 5 条，并标记今晚上线必须具备的项。"
  },
  {
    id: "seed-3",
    title: "部署前冒烟检查提示词",
    stage: "80%-100% 部署期",
    content:
      "生成上线前检查清单：构建成功、核心路径可用、一键复制正常、localStorage 可读写。"
  }
];

const { prompts, upsertPrompt, removePrompt } = usePrompts(seedPrompts);

const selectedStage = ref<"ALL" | string>("ALL");
const keyword = ref("");
const activePromptId = ref("");
const copyNotice = ref("");
const isFormOpen = ref(false);

const form = reactive({
  id: "",
  title: "",
  stage: stageOptions[0],
  content: ""
});

const filteredPrompts = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return prompts.value.filter((item) => {
    const matchStage = selectedStage.value === "ALL" || item.stage === selectedStage.value;
    const matchKeyword =
      q.length === 0 ||
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q);
    return matchStage && matchKeyword;
  });
});

const stageCounts = computed(() => {
  const map = new Map<string, number>();
  for (const stage of stageOptions) map.set(stage, 0);
  for (const item of prompts.value) {
    map.set(item.stage, (map.get(item.stage) ?? 0) + 1);
  }
  return map;
});

const activePrompt = computed(() => prompts.value.find((item) => item.id === activePromptId.value) ?? null);

watch(
  filteredPrompts,
  (list) => {
    if (list.length === 0) {
      activePromptId.value = "";
      return;
    }
    if (!list.some((item) => item.id === activePromptId.value)) {
      activePromptId.value = list[0].id;
    }
  },
  { immediate: true }
);

function stageCount(stage: string) {
  return stageCounts.value.get(stage) ?? 0;
}

function allCount() {
  return prompts.value.length;
}

function excerpt(text: string, max = 90) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function openCreateForm() {
  form.id = "";
  form.title = "";
  form.stage = selectedStage.value === "ALL" ? stageOptions[0] : selectedStage.value;
  form.content = "";
  isFormOpen.value = true;
}

function openEditForm() {
  if (!activePrompt.value) return;
  form.id = activePrompt.value.id;
  form.title = activePrompt.value.title;
  form.stage = activePrompt.value.stage;
  form.content = activePrompt.value.content;
  isFormOpen.value = true;
}

function closeForm() {
  isFormOpen.value = false;
}

function savePrompt() {
  if (!form.title.trim() || !form.content.trim()) return;

  const saved = upsertPrompt({
    id: form.id || undefined,
    title: form.title.trim(),
    stage: form.stage,
    content: form.content.trim()
  });

  activePromptId.value = saved.id;
  isFormOpen.value = false;
}

function deletePrompt() {
  if (!activePrompt.value) return;
  const ok = window.confirm(`确认删除「${activePrompt.value.title}」吗？`);
  if (!ok) return;
  removePrompt(activePrompt.value.id);
}

async function copyPrompt() {
  if (!activePrompt.value) return;

  try {
    await navigator.clipboard.writeText(activePrompt.value.content);
    copyNotice.value = "已复制到剪贴板";
    setTimeout(() => {
      if (copyNotice.value === "已复制到剪贴板") {
        copyNotice.value = "";
      }
    }, 1200);
  } catch {
    copyNotice.value = "复制失败，请手动复制。";
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <div class="mx-auto max-w-7xl p-4 md:p-6">
      <header class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Vibe Prompt Hub</h1>
          <p class="text-sm text-slate-600">阶段化提示词管理、本地存储、一键复制</p>
        </div>
        <div class="flex w-full gap-2 md:w-auto">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索标题或正文"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 md:w-72"
          />
          <button
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            @click="openCreateForm"
          >
            新建
          </button>
        </div>
      </header>

      <main class="grid gap-4 lg:grid-cols-[220px_1fr_360px]">
        <aside class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="mb-3 text-sm font-semibold text-slate-700">阶段筛选</p>
          <div class="space-y-2">
            <button
              class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition"
              :class="
                selectedStage === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              "
              @click="selectedStage = 'ALL'"
            >
              <span>全部阶段</span>
              <span>{{ allCount() }}</span>
            </button>

            <button
              v-for="stage in stageOptions"
              :key="stage"
              class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition"
              :class="
                selectedStage === stage
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              "
              @click="selectedStage = stage"
            >
              <span>{{ stage }}</span>
              <span>{{ stageCount(stage) }}</span>
            </button>
          </div>
        </aside>

        <section class="rounded-xl border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
            提示词列表（{{ filteredPrompts.length }}）
          </div>
          <div class="max-h-[75vh] overflow-auto p-2">
            <button
              v-for="item in filteredPrompts"
              :key="item.id"
              class="mb-2 w-full rounded-lg border px-3 py-3 text-left transition"
              :class="
                activePromptId === item.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              "
              @click="activePromptId = item.id"
            >
              <p class="font-semibold">{{ item.title }}</p>
              <p class="mt-1 text-xs opacity-80">{{ item.stage }}</p>
              <p class="mt-2 text-xs opacity-80">{{ excerpt(item.content) }}</p>
            </button>

            <p v-if="filteredPrompts.length === 0" class="px-3 py-8 text-center text-sm text-slate-500">
              当前筛选下没有提示词。
            </p>
          </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white p-4">
          <template v-if="!isFormOpen">
            <template v-if="activePrompt">
              <p class="text-xs text-slate-500">{{ activePrompt.stage }}</p>
              <h2 class="mt-1 text-xl font-bold">{{ activePrompt.title }}</h2>
              <pre
                class="mt-3 max-h-[48vh] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6"
              >{{ activePrompt.content }}</pre>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <button
                  class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  @click="copyPrompt"
                >
                  一键复制
                </button>
                <button
                  class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  @click="openEditForm"
                >
                  编辑
                </button>
                <button
                  class="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                  @click="deletePrompt"
                >
                  删除
                </button>
                <span class="text-sm text-emerald-700">{{ copyNotice }}</span>
              </div>
            </template>
            <template v-else>
              <p class="py-10 text-center text-sm text-slate-500">没有可展示的提示词，点击“新建”开始。</p>
            </template>
          </template>

          <template v-else>
            <h2 class="text-lg font-bold">{{ form.id ? "编辑提示词" : "新建提示词" }}</h2>
            <form class="mt-3 space-y-3" @submit.prevent="savePrompt">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">标题</label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="例如：开发阶段代码审查提示词"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">阶段</label>
                <select
                  v-model="form.stage"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option v-for="stage in stageOptions" :key="stage" :value="stage">{{ stage }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">正文</label>
                <textarea
                  v-model="form.content"
                  rows="12"
                  placeholder="在这里粘贴你的完整提示词..."
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="submit"
                  class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  保存
                </button>
                <button
                  type="button"
                  class="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                  @click="closeForm"
                >
                  取消
                </button>
              </div>
            </form>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>
