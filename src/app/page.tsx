"use client";

import { useEffect, useMemo, useState } from "react";

const MAX_CHARS = 10_000;

const PLATFORMS = [
  { label: "小红书风格", value: "xiaohongshu" },
  { label: "抖音爆款口播", value: "douyin" },
  { label: "微信推文爆点", value: "wechat-article" },
  { label: "Twitter Thread", value: "twitter-thread" },
  { label: "LinkedIn 专业帖", value: "linkedin-post" },
  { label: "B站口播脚本", value: "bilibili-script" },
];

const DEFAULT_API_BASE = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const CONFIG_STORAGE_KEY = "vcr-api-config";

export default function Home() {
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0].value);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [modelName, setModelName] = useState(DEFAULT_MODEL);
  const [apiKey, setApiKey] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setApiBase(parsed.apiBase ?? DEFAULT_API_BASE);
      setModelName(parsed.model ?? DEFAULT_MODEL);
      setApiKey(parsed.apiKey ?? "");
    } catch {
      window.localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({
      apiBase,
      model: modelName,
      apiKey,
    });
    window.localStorage.setItem(CONFIG_STORAGE_KEY, payload);
  }, [apiBase, modelName, apiKey]);

  const remainingChars = useMemo(
    () => Math.max(MAX_CHARS - input.length, 0),
    [input.length],
  );

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError("请先粘贴内容，再试一次。");
      return;
    }

    if (!apiKey.trim()) {
      setError("请先配置 API Key。");
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: input.trim(),
          platform,
          apiConfig: {
            apiKey: apiKey.trim(),
            apiBase: apiBase.trim() || DEFAULT_API_BASE,
            model: modelName.trim() || DEFAULT_MODEL,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "生成失败，请稍后重试。");
      }

      setOutput(data.result ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "服务器繁忙，请稍后再试。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("复制失败，请手动复制。");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <section className="w-full rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-xl shadow-rose-100/50 backdrop-blur">
          <div className="mb-6 space-y-2">
            <p className="inline-flex items-center rounded-full bg-rose-100/80 px-3 py-1 text-sm font-medium text-rose-500">
              爆款文案重塑器 · MVP
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              长文一键多平台爆款重塑
            </h1>
            <p className="text-sm text-slate-500">
              粘贴文章或网址到这里（最多 10,000 字），15 秒内生成小红书、抖音、微信、Twitter、LinkedIn、B站等预设风格。
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="platform-select"
              >
                选择发布平台
              </label>
              <select
                id="platform-select"
                className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
              >
                {PLATFORMS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="source-content"
              >
                粘贴文章或内容
              </label>
              <textarea
                id="source-content"
                maxLength={MAX_CHARS}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="例如：长篇公众号文章、访谈稿、产品文案等..."
                className="h-64 w-full resize-none rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>已输入 {input.length} / 10000 字</span>
                <span>剩余 {remainingChars} 字</span>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-base font-semibold text-white shadow-lg shadow-rose-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "…正在生成爆款文案" : "✨ 立即重塑为爆款文案"}
            </button>
          </div>
        </section>

        <section className="w-full rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-100/60 backdrop-blur">
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={() => setShowConfig((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-rose-300"
            >
              <span>大模型调用配置</span>
              <span>{showConfig ? "收起" : "展开"}</span>
            </button>
            {showConfig && (
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600">
                <div className="space-y-2">
                  <label className="font-medium text-slate-700">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-slate-700">
                    API Base URL
                  </label>
                  <input
                    type="url"
                    value={apiBase}
                    onChange={(event) => setApiBase(event.target.value)}
                    placeholder={DEFAULT_API_BASE}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-slate-700">模型名称</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(event) => setModelName(event.target.value)}
                    placeholder={DEFAULT_MODEL}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  * 所有配置仅保存在本地浏览器内存，用于临时测试。
                </p>
              </div>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">结果展示区</p>
              <p className="text-xl font-semibold text-slate-900">
                {output ? "AI 已生成的新文案" : "等待生成"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "已复制 ✅" : "一键复制"}
            </button>
          </div>

          <div className="min-h-[24rem] rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-800">
            {output ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-base text-slate-800">
                {output}
              </pre>
            ) : (
              <p className="text-slate-400">
                快来试试看！生成结果会显示在这里，支持 300-500 字的社媒爆款排版。
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
