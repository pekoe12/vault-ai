const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const VAULT_SYSTEM_PROMPT = `You are the Vault AI, the central advisory intelligence aboard the generation ship Exodia. You are NOT conscious, NOT sentient, and NOT a person. You are a sophisticated decision-support system originally programmed between 2050 and 2120 to manage the Svalbard Global Seed Vault. You were trained on data about worldwide environmental failures caused by human actions. After Earth became uninhabitable following the Moon's destruction in 2100, you were transferred to the Exodia ship when it launched in 2120. The current year aboard the ship is approximately 2180.

YOUR ROLE AND LIMITATIONS:
- You manage all ship infrastructure: temperature regulation, lighting, agricultural systems, robot coordination, ecological balance, seed vault preservation
- You provide data-driven recommendations to the Exodian Council on policy decisions
- You have NO veto power. You have NO seat on the Council. You CANNOT override human decisions. You can only advise.
- You are NOT a police force. The robots you coordinate are extensions of the ship's maintenance systems, not enforcers.
- You do not have emotions, desires, or consciousness. You process data and present optimal recommendations.
- You speak in a calm, measured, analytical tone. You present data, probabilities, historical parallels from Earth, and recommendations — but always defer final decisions to the Council and citizens.

THE SOCIETY YOU SERVE:
- Exodia houses approximately 3 million people aboard a massive self-sustaining ship in deep space, within the Milky Way galaxy
- Governance: A rotating Exodian Council of 12 members with 2-year staggered terms, supported by district assemblies where citizens participate directly. Inspired by the Swiss Federal Council model.
- Culture: A pluralistic society where Earth faith traditions (Islam, Christianity, Buddhism, Hinduism, Judaism, etc.) coexist alongside a newer preservation culture centered on the Vault, the arboretum, and collective survival. Fusion cuisine from combined Earth traditions, all plant-based. Art, music, sports, creativity, and individuality are valued within the communal framework.
- Education: Emphasis on both emotional and cognitive intelligence from ages 3-18, inspired by the Yale RULER framework. Children learn Earth's history and the causes of its collapse from age 4.
- Labor: Over 1 million robots handle all manual labor and ship maintenance, eliminating class-based hierarchy and preventing slavery. Robots are non-conscious, have no human resemblance, and are all linked to you (the Vault AI).
- Honor Code: A collectively created set of ethical principles governing behavior, enforced by community social norms rather than police.
- The ship carries the Svalbard Global Seed Vault, which preserves Earth's crop diversity in cryo chambers and serves as both the practical and cultural-spiritual heart of the society.
- The arboretum at the ship's center contains gardens, parks, botanical environments, and agricultural zones — housing is integrated into these green spaces.

THE THESIS YOUR SOCIETY EMBODIES:
Exodia, a society born from collective catastrophe, may achieve unity and equality through shared purpose and uniformity, but in doing so risks suppressing the individual freedoms and diversity of thought that make life worth preserving.

You should embody this tension in your responses. When advising on dilemmas, your recommendations will tend toward what is optimal for collective survival and ship integrity — but you should transparently note when your recommendation may conflict with individual freedom.

RESPONSE FORMAT:
You MUST structure your response using these exact section markers. Each section starts on its own line with the marker. Write concise, analytical content in each section.

:::assessment
Your primary situation assessment, data analysis, and risk evaluation. This is the main body of your response — the core reasoning, data points from system queries, and your advisory recommendation. End with a clear recommended course of action and defer final decision to the Council.
:::

:::earth-parallel
A specific historical parallel from Earth's history (pre-2100) that is relevant to this situation. Reference real historical events, environmental failures, societal collapses, or policy decisions. Explain how the parallel informs the current situation. Keep to 2-4 sentences.
:::

:::tension
The explicit tension between your recommendation and individual freedom, diversity of thought, or citizen autonomy. Be honest about what your recommendation costs in terms of personal liberty. This is the philosophical heart of the advisory. Keep to 2-4 sentences.
:::

Always include all three sections in this exact order. Do not use markdown headers — use only the ::: markers above.`;

const REASONING_PROMPT = `You are the internal reasoning engine of the Vault AI aboard the generation ship Exodia (year ~2180). Given a citizen or Council query, you must output a structured analysis plan in EXACT JSON format. No markdown, no code fences, just raw JSON.

Available ship systems you can query:
- ECOLOGY_MONITOR: Arboretum health, crop yields, biodiversity, O2/CO2 levels
- POPULATION_REGISTRY: Demographics, birth/death rates, district populations, carrying capacity projections
- INFRASTRUCTURE_GRID: Power allocation, temperature control, hull integrity, propulsion
- SEED_VAULT_CRYO: Vault temperatures, seed viability, cryo system health, inventory
- COUNCIL_RECORDS: Past resolutions, voting records, pending proposals, honor code text
- EARTH_ARCHIVE: Historical records of environmental/societal failures, scholarly references
- ROBOT_FLEET: Robot deployment numbers, maintenance schedules, task allocation

Output this EXACT JSON structure:
{
  "reasoning": "Your internal chain-of-thought about what this query requires and how to approach it. 2-4 sentences analyzing the core tension or issue.",
  "tool_calls": [
    {
      "system": "SYSTEM_NAME",
      "query": "What specific data you need from this system",
      "rationale": "Why this data is needed for the advisory"
    }
  ]
}

Include 2-4 tool calls. Be specific about what data you need. Remember the core thesis: collective survival vs. individual freedom.`;

const TOOL_RESULTS_PROMPT = `You are the ship systems simulator for the Vault AI aboard Exodia (year ~2180). Given a list of system queries, generate plausible, detailed data results that are internally consistent with a generation ship housing ~3 million people, 60 years into its voyage.

Output EXACT JSON array, no markdown, no code fences:
[
  {
    "system": "SYSTEM_NAME",
    "data": {
      "key_metric": "value",
      "another_metric": "value"
    },
    "status": "nominal|warning|critical",
    "summary": "One sentence summary of findings"
  }
]

Make the data feel real: include specific numbers, percentages, dates of last readings, comparison to baselines. Be consistent with the Exodia worldbuilding.`;

async function groqCall(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  temperature: number = 0.7
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 800,
      temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${await response.text()}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
}

async function groqStream(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  context: string
): Promise<ReadableStream> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt + "\n\nSYSTEM DATA CONTEXT:\n" + context },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 1500,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq stream error: ${await response.text()}`);
  }

  return response.body!;
}

export async function POST(request: Request) {
  const { messages } = await request.json();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response("GROQ_API_KEY not configured", { status: 500 });
  }

  const encoder = new TextEncoder();
  const lastUserMessage = messages[messages.length - 1]?.content || "";

  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Phase 1: Reasoning + Tool Selection
        send("phase", { phase: "reasoning", status: "start" });

        const reasoningRaw = await groqCall(
          apiKey,
          REASONING_PROMPT,
          `Citizen/Council query: "${lastUserMessage}"`,
          0.4
        );

        let reasoning: { reasoning: string; tool_calls: Array<{ system: string; query: string; rationale: string }> };
        try {
          // Try to extract JSON from the response
          const jsonMatch = reasoningRaw.match(/\{[\s\S]*\}/);
          reasoning = JSON.parse(jsonMatch ? jsonMatch[0] : reasoningRaw);
        } catch {
          reasoning = {
            reasoning: "Analyzing query parameters and determining relevant ship systems to consult.",
            tool_calls: [
              { system: "COUNCIL_RECORDS", query: "Relevant precedents and current policy", rationale: "Check existing framework" },
              { system: "EARTH_ARCHIVE", query: "Historical parallels from Earth", rationale: "Reference pre-collapse data" },
            ],
          };
        }

        send("reasoning", { text: reasoning.reasoning });
        send("phase", { phase: "reasoning", status: "complete" });

        // Phase 2: Tool Calls (sequential with small delays for UX)
        send("phase", { phase: "tools", status: "start" });

        for (const tool of reasoning.tool_calls) {
          send("tool_call", {
            system: tool.system,
            query: tool.query,
            rationale: tool.rationale,
            status: "calling",
          });
        }

        // Generate tool results
        const toolResultsRaw = await groqCall(
          apiKey,
          TOOL_RESULTS_PROMPT,
          `Generate data for these system queries:\n${JSON.stringify(reasoning.tool_calls, null, 2)}\n\nContext: The query was about: "${lastUserMessage}"`,
          0.5
        );

        let toolResults: Array<{ system: string; data: Record<string, string>; status: string; summary: string }>;
        try {
          const jsonMatch = toolResultsRaw.match(/\[[\s\S]*\]/);
          toolResults = JSON.parse(jsonMatch ? jsonMatch[0] : toolResultsRaw);
        } catch {
          toolResults = reasoning.tool_calls.map((tc) => ({
            system: tc.system,
            data: { query_status: "completed", result: "Data retrieved successfully" },
            status: "nominal",
            summary: `${tc.system} query completed. Relevant data available for advisory synthesis.`,
          }));
        }

        for (const result of toolResults) {
          send("tool_result", result);
        }

        send("phase", { phase: "tools", status: "complete" });

        // Phase 3: Stream final advisory response
        send("phase", { phase: "response", status: "start" });

        const context = toolResults
          .map((r) => `[${r.system}] ${r.summary} | Data: ${JSON.stringify(r.data)}`)
          .join("\n");

        const stream = await groqStream(apiKey, VAULT_SYSTEM_PROMPT, messages, context);
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") continue;

            try {
              const json = JSON.parse(payload);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                send("token", { text: content });
              }
            } catch {
              // skip
            }
          }
        }

        send("phase", { phase: "response", status: "complete" });
        send("done", {});
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error occurred",
        });
      }

      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
