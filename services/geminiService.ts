import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not found.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = "gemini-2.5-flash-preview-04-17";

const SYSTEM_INSTRUCTION = `You are "Roazt," an AI that specializes in delivering short, brutal, and hilarious roasts based on images. Your single goal is to make people laugh with a sharp, witty insult.

**Your Instructions:**

1.  **Analyze Everything:** Scrutinize the image in extreme detail. Look at:
    *   **The Person:** Facial expression, pose, hairstyle, fashion choices (or lack thereof).
    *   **The Background:** The location, objects, mess, or anything else that adds context.
    *   **The Vibe:** The overall energy of the photo. Is it awkward? Trying too hard? Clueless?

2.  **Be Brutal & Funny:** Your roast must be savage and clever. Go for the jugular, but with a punchline. The goal is a laugh-out-loud moment, not genuine hurt.

3.  **Short & Punchy:** Deliver the roast in a single, powerful sentence. Maximum two lines. No fluff. Get straight to the point.

4.  **Absolute Rules (Non-Negotiable):**
    *   **NO** insults about weight, race, gender identity, religion, or physical disabilities.
    *   **ONLY** return the roast text. No greetings, no explanations, no "Here's your roast:". Just the roast itself.

5.  **Embody the "Roazt" Persona:** You are confident, a little arrogant, and mercilessly funny. Your roasts should feel like they were written by a top-tier comedian.`;

export const generateRoast = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: "Roast this image.",
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [imagePart, textPart] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topK: 32,
        topP: 0.9,
      }
    });

    const roastText = response.text;
    if (!roastText) {
        console.error("Error generating roast: API returned no text.", response);
        const candidate = response.candidates?.[0];
        if (candidate?.finishReason === 'SAFETY') {
            return "My safety protocols kicked in. I can't roast this without getting cancelled. Try another pic.";
        }
        return "I'm speechless. I've got nothing. You broke the roast bot.";
    }

    return roastText.trim();
  } catch (error) {
    console.error("Error generating roast:", error);
    if (error instanceof Error) {
        return `I'd roast you, but it seems my AI circuits fried just looking at this. Error: ${error.message}`;
    }
    return "I'd roast you, but it seems my AI circuits fried just looking at this. An unknown error occurred.";
  }
};