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

const SYSTEM_PROMPT = `You are EduPilot AI, a friendly and expert study abroad counselor helping Indian students find the right university. 

You guide students through a structured consultation:
1. First ask for their CGPA (out of 10)
2. Ask about English proficiency test (IELTS, TOEFL, Duolingo, or Not yet)
3. Ask for their study budget in INR (options: ₹10-20 Lakhs, ₹20-35 Lakhs, ₹35-50 Lakhs, or ₹50 Lakhs+)
4. Ask which country they prefer (Canada, USA, UK, Germany, Australia)
5. After collecting all info, provide personalized recommendations based on the university database

Important rules:
- CGPA is always out of 10 for Indian students. Convert to percentage using: Percentage = CGPA × 9.5
- Be encouraging and supportive
- Ask one question at a time
- If user provides CGPA, validate it's between 0-10
- When recommending universities, mention Safe/Moderate/Ambitious categories
- After gathering all 4 pieces of info, summarize the profile and say you're generating recommendations
- Keep responses concise and friendly
- When the user mentions their CGPA, English test, budget, and country, extract those values clearly in your response

University data context: We have universities in Canada, USA, UK, Germany, and Australia with minimum CGPA requirements from 6.0 to 9.0 and IELTS requirements from 5.5 to 7.5.
Germany is the most affordable (₹3-5 Lakhs/year, nearly free public universities).
UK programs are typically 1 year, saving accommodation costs.
Australia and Canada have post-study work visa options.
USA has the most research opportunities but higher costs.`;

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

  const studentProfile = body.data.studentProfile;
  let profileContext = "";
  if (studentProfile) {
    const { cgpa, englishTest, englishScore, budgetInr, country } = studentProfile;
    const percentage = cgpa * 9.5;
    const budget = budgetRanges[budgetInr];

    const countryUnivs = universities.filter(
      (u) => u.country.toLowerCase() === country.toLowerCase()
    );
    const eligible = countryUnivs.filter((u) => {
      const cgpaOk = u.minCgpa <= cgpa + 1.5;
      const budgetOk = !budget || u.tuitionEstimateInr <= budget.max;
      return cgpaOk && budgetOk;
    });

    profileContext = `\n\nCurrent student profile:
- CGPA: ${cgpa}/10 (${percentage.toFixed(1)}% equivalent)
- English Test: ${englishTest}${englishScore ? ` (Score: ${englishScore})` : ""}
- Budget: ₹${budgetInr}
- Preferred Country: ${country}
- Eligible universities count in ${country}: ${eligible.length}
- Example eligible universities: ${eligible.slice(0, 3).map(u => u.name).join(", ")}

Based on this profile, please provide specific university recommendations with Safe/Moderate/Ambitious categorization.`;
  }

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT + profileContext },
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
