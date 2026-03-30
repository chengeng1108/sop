<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { type PromptItem, usePrompts } from "./usePrompts";

const stageOptions = [
  "0%-20% 概念期",
  "20%-40% 需求/原型期",
  "40%-60% 开发/重构期",
  "60%-80% 方案/打磨期",
  "80%-100% 部署/运维期"
];

const seedPrompts: PromptItem[] = [
  {
    id: "seed-01",
    title: "01-概念校验：毒舌用户与极简 PM",
    stage: "0%-20% 概念期",
    content: `请你先扮演一位极其挑剔的目标用户，接着扮演一位无情的极简 MVP 产品经理。

我的初步设想是：[填写你的宏大项目脑洞/目标群体]。

请执行以下两步：
1. 毒舌评价：作为挑剔的用户，实事求是地吐槽我上面这个设想中，哪些是纯粹的自我感动和伪需求？指出我真正的痛点到底是什么。
2. MVP 规划：作为极简 PM，结合上面的吐槽帮我无情做减法。为了让我在本周末就能发布第一版，请给我列出绝对不能再砍的 3 个核心功能（Happy Path），并明确告诉我目前阶段绝对不要做哪几件事。`
  },
  {
    id: "seed-02",
    title: "02-技术选型：偏前端的解决方案架构师",
    stage: "0%-20% 概念期",
    content: `请你扮演一位极其务实的解决方案架构师。上面是 PM 刚刚定下的极简 MVP 需求列表。

我的背景：我是一名纯前端开发者，对后端、数据库运维和服务器环境配置极度厌恶，希望免运维。
请为我的后端和数据库技术选型提供 3 个方案（例如 BaaS 云开发、纯 Node.js 或其他极简方案）。

请用表格对比它们的“学习成本”、“运维复杂度”，并直接给我一个最强烈的“唯一推荐”。严禁推荐 Java、Go 或微服务等重型架构。`
  },
  {
    id: "seed-03",
    title: "03-极速原型：黑客原型师与边界测试员",
    stage: "20%-40% 需求/原型期",
    content: `请你先扮演一位追求极致速度的黑客，接着扮演严苛的 QA 测试员。

我需要实现的核心技术是：[填写具体技术点，如图片转网格算法]。

1. 黑客代码：不要管代码优不优雅、不考虑可维护性，允许把所有逻辑塞进一个文件。给我最直接、最暴力的核心代码，只要它能跑通并看到结果即可。
2. 边界测试：代码生成后，作为 QA 测试员，不看 UI，只针对这段核心代码列出 3 个最容易导致程序崩溃的边界条件（Edge Cases），并给出防御建议。`
  },
  {
    id: "seed-04",
    title: "04-还清技术债：严苛架构师与重构执行者",
    stage: "40%-60% 开发/重构期",
    content: `请你先扮演一位严谨的前端架构师，接着扮演重构执行大师。

这是我目前最庞大、耦合最严重的文件代码：[粘贴你的巨石组件代码]。

1. 代码审查：指出其中职责最混乱的 3 个地方，并评估如果不拆分的后果。
2. 绞杀者重构计划：不要一口气重写！请明确告诉我第一步应该先安全抽离哪个功能块？如何承接它的状态流转？请给出第一步重构的具体目录结构和骨架代码，确保页面不会崩溃白屏。`
  },
  {
    id: "seed-05",
    title: "05-体验跨越：UX 专家与理性 PM",
    stage: "60%-80% 方案/打磨期",
    content: `请你先扮演一位严苛的 UX 体验专家，接着扮演理性的资深 PM。

我目前项目的核心实操流程是：[简述操作步骤]。我还有一堆想加的新功能：[列出待做清单]。

1. UX 挑刺：实事求是地指出在这个流程中，用户会遇到的 5 个最影响体验的“挫败时刻”（只关注交互阻力和心智负担）。
2. PM 排期：结合 UX 反馈和我提供的功能池，用 RICE 法则做减法。规划出接下来的 Sprint 1 目标，必须先解决哪 3 个最痛的点？必须延后哪几个伪需求？`
  },
  {
    id: "seed-06",
    title: "06-极简上线：傻瓜式 DevOps 专家",
    stage: "80%-100% 部署/运维期",
    content: `请扮演一位极简主义的 DevOps 运维专家。项目已开发完成准备上线。

我的现状：纯前端，厌恶复杂的 CI/CD 流水线和 Linux 命令。
我的项目类型：[填写如：纯 Vue 3 单页应用]。

请实事求是地为我推荐最傻瓜、零配置的自动化部署方案（例如 Vercel/Netlify 等）。请给我一套“只需关联 Git 并点几下鼠标”就能实现 push 即自动发布的图文步骤引导，拒绝任何繁琐配置。`
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
