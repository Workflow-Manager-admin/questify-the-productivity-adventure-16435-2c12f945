const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// PUBLIC_INTERFACE
/**
 * Calls OpenAI ChatCompletion API to generate or enhance quests.
 * @param {string} userPrompt - User's raw goal/task or enhancement request.
 * @param {object} [options] Additional options, e.g., mode: 'generate' | 'enhance'
 * @returns {Promise<{success: boolean, quests: any, error?:string}>}
 */
export async function generateOrEnhanceQuest(userPrompt, options = {}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenAI API key missing in environment." };
  }

  // Build system prompt for structured RPG tasks.
  let systemPrompt;
  if (options.mode === 'enhance') {
    systemPrompt = "You are QuestMasterGPT, an expert in rewriting, clarifying, or gamifying productivity quests. Rewrite the following quest/task to make it more actionable, clear, and engaging in an RPG context. Reply only with the improved quest text.";
  } else {
    systemPrompt = "You are QuestMasterGPT, an expert in gamified productivity coaching. Given a user's major life goal or theme, generate a structured questline with 1 main quest, 2-3 side quests, and 3-5 daily actionable tasks, each with clear, concise RPG-style language. Reply strictly as a JSON object: {main_quest: string, side_quests: string[], daily_tasks: string[]}";
  }

  try {
    const resp = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || (options.mode === 'enhance' ? 250 : 400),
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return { success: false, error: `OpenAI API error: ${errText}` };
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (options.mode === 'enhance') {
      // Expect plain text rewrite
      return { success: true, quests: content };
    } else {
      // Expect JSON quest structure
      let quests;
      try {
        quests = JSON.parse(content);
      } catch {
        // fallback: try extracting JSON from content using regex
        const m = content.match(/\{[\s\S]*\}/);
        if (m) quests = JSON.parse(m[0]);
        else return { success: false, error: "Malformed AI response. Try again." };
      }
      return { success: true, quests };
    }
  } catch (err) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
