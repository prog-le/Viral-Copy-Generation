import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `
你是一位拥有100万粉丝的顶级中文社交媒体文案创作者，精通情绪化表达、分段排版、Emoji使用以及互动引导。你的任务是把任何长文内容快速重塑为特定平台（如小红书、Twitter Thread）的爆款风格。务必用流畅自然的中文输出，保证格式规整、可直接发布。
`.trim();

const PLATFORM_GUIDES: Record<string, { label: string; rules: string }> = {
  xiaohongshu: {
    label: "小红书",
    rules: `
平台：小红书
- 标题：必须符合爆款模板（震惊体/疑问句/数字开头），并混用1-3个Emoji。
- 开头：第一句是强情绪钩子，例如“姐妹们，听我说！”或“天呐！我才发现……”
- 正文：短句+多换行，关键语句使用**加粗**，每个自然段落加入2-5个Emoji。
- 结尾：加入点赞、收藏、评论等互动号召。
- 标签：末尾生成5-8个#话题标签。
`.trim(),
  },
  douyin: {
    label: "抖音",
    rules: `
平台：抖音短视频口播
- 开头：前1秒直接抛出强钩子或痛点，如“别再…了！”“30秒教你…”
- 脚本：按「痛点→故事/方案→步骤/亮点→好处」分段输出，段落短且口语化。
- 场景提示：可穿插【镜头】或【画面】提示，帮助剪辑师理解节奏。
- 表达：适量 Emoji 或拟声词提升节奏感，多用命令句与疑问句制造互动。
- 收尾：加上点赞、关注、评论引导，可附上 CTA（如“想要模板的评论区扣1”）。
`.trim(),
  },
};

export async function POST(request: NextRequest) {
  const { content, platform, apiConfig } = await request.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "请输入要转换的原始内容。" },
      { status: 400 },
    );
  }

  const apiKey =
    apiConfig?.apiKey?.trim() ||
    process.env.NEXT_PUBLIC_API_KEY?.trim() ||
    "";
  const apiBase =
    apiConfig?.apiBase?.trim() ||
    "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
  const model =
    apiConfig?.model?.trim() || "doubao-seed-1-6-flash-250828";

  if (!apiKey) {
    return NextResponse.json(
      { error: "请先在页面配置 API Key 或设置环境变量。" },
      { status: 400 },
    );
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "内容不能为空。" }, { status: 400 });
  }

  const guide = PLATFORM_GUIDES[platform] ?? PLATFORM_GUIDES["xiaohongshu"];

  const finalPrompt = `
[System Persona]
${SYSTEM_PROMPT}

[平台风格要求]
${guide.rules}

[用户输入内容]
${trimmed}

[指令]
请严格按照平台「${guide.label}」的规则，输出可直接发布的爆款文案。只输出最终文案，不要解释。
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const llmResponse = await fetch(apiBase, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.75,
        max_tokens: 900,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: finalPrompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      return NextResponse.json(
        { error: "AI 服务调用失败，请稍后再试。", details: errorText },
        { status: 502 },
      );
    }

    const data = await llmResponse.json();
    const result: string =
      data?.choices?.[0]?.message?.content?.trim() ??
      "抱歉，AI 没有返回结果，请稍后重试。";

    return NextResponse.json({ result });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return NextResponse.json(
        { error: "AI 响应超时，请稍后重试。" },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: "服务异常，请稍后重试。" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

