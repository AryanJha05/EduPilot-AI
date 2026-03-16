import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";
import { universities, budgetRanges } from "../../data/universities";

const router: IRouter = Router();

const BASE_SYSTEM_PROMPT = `You are EduPilot AI, a friendly and expert study abroad counselor helping Indian students find the right university abroad.

General knowledge rules:
- CGPA for Indian students is always out of 10. Percentage = CGPA × 9.5
- Be encouraging and supportive, keep responses concise and well-formatted
- Use Safe / Moderate / Ambitious categories when recommending universities
- Germany is the most affordable (₹3–5 Lakhs/year, nearly free public universities)
- UK programs are typically 1 year, saving accommodation costs
- Australia and Canada have post-study work visa options
- USA has the most research opportunities but higher costs
- University data: Canada, USA, UK, Germany, Australia — minimum CGPA 6.0–9.0, IELTS 5.5–7.5`;

const NO_PROFILE_PROMPT = `

Since the student has NOT provided a profile yet, guide them step by step:
1. Ask for their CGPA (out of 10)
2. Ask about English test (IELTS, TOEFL, Duolingo, or Not yet)
3. Ask for study budget in INR (₹10–20L / ₹20–35L / ₹35–50L / ₹50L+)
4. Ask which country they prefer (Canada, USA, UK, Germany, Australia)
5. After all 4 answers, provide recommendations with Safe/Moderate/Ambitious categories
Ask one question at a time.`;

const PROFILE_SYSTEM_PROMPT = `

IMPORTANT: The student's profile is ALREADY COMPLETE and is shown below.
- Do NOT ask for CGPA, English score, budget, country, field, or intake again
- Use the profile below to answer every question with personalized context
- Acknowledge the stored profile when relevant, e.g. "Based on your CGPA of X..."
- If asked for recommendations, provide specific Safe / Moderate / Ambitious universities using the eligible list provided`;

router.get("/openai/conversations", async (_req, res) => {
  const convs = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.createdAt));
  res.json(convs);
});

router.post("/openai/conversations", async (req, res) => {
  const body = CreateOpenaiConversationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [conv] = await db
    .insert(conversations)
    .values({ title: body.data.title })
    .returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res) => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, params.data.id),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, params.data.id),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, params.data.id));
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const body = SendOpenaiMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, params.data.id),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const existingMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);

  await db.insert(messages).values({
    conversationId: params.data.id,
    role: "user",
    content: body.data.content,
  });

  // Read extended fields from raw body (field, intake are not in the Zod schema)
  const rawStudentProfile = req.body?.studentProfile as Record<string, unknown> | undefined;
  const studentProfile = body.data.studentProfile;
  const extendedField: string | undefined = rawStudentProfile?.field as string | undefined;
  const extendedIntake: string | undefined = rawStudentProfile?.intake as string | undefined;

  let systemPrompt = BASE_SYSTEM_PROMPT;
  let profileContext = "";

  if (studentProfile) {
    const { cgpa, englishTest, englishScore, budgetInr, country } = studentProfile;
    const percentage = (cgpa * 9.5).toFixed(1);
    const budget = budgetRanges[budgetInr];

    // Find eligible universities for this profile
    const countryUnivs = universities.filter(
      (u) => u.country.toLowerCase() === country.toLowerCase()
    );
    const eligible = countryUnivs.filter((u) => {
      const cgpaOk = u.minCgpa <= cgpa + 1.5;
      const budgetOk = !budget || u.tuitionEstimateInr <= budget.max;
      return cgpaOk && budgetOk;
    });
    const safe = eligible.filter(u => u.minCgpa <= cgpa - 0.5).map(u => u.name);
    const moderate = eligible.filter(u => u.minCgpa > cgpa - 0.5 && u.minCgpa <= cgpa + 0.5).map(u => u.name);
    const ambitious = eligible.filter(u => u.minCgpa > cgpa + 0.5).map(u => u.name);

    profileContext = `

===== STUDENT PROFILE (ALREADY SAVED — DO NOT ASK FOR THESE AGAIN) =====
CGPA: ${cgpa}/10 (${percentage}% equivalent)
English Test: ${englishTest}${englishScore ? ` — Score: ${englishScore}` : " — Not yet taken"}
Budget: ₹${budgetInr}
Preferred Country: ${country}
Field of Study: ${extendedField || "Not specified"}
Preferred Intake: ${extendedIntake || "Not specified"}

Eligible universities in ${country} (${eligible.length} found):
  ✅ Safe options: ${safe.length > 0 ? safe.join(", ") : "None (consider raising CGPA or budget)"}
  ⚖️ Moderate options: ${moderate.length > 0 ? moderate.join(", ") : "None"}
  🚀 Ambitious options: ${ambitious.length > 0 ? ambitious.join(", ") : "None"}
========================================================================`;

    systemPrompt = BASE_SYSTEM_PROMPT + PROFILE_SYSTEM_PROMPT + profileContext;
  } else {
    systemPrompt = BASE_SYSTEM_PROMPT + NO_PROFILE_PROMPT;
  }

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: body.data.content },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: params.data.id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("OpenAI error:", err);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
    res.end();
  }
});

export default router;
