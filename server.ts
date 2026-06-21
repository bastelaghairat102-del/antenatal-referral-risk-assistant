import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Initialize GoogleGenAI client lazily to avoid startup crashes if key is initially absent
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or API_KEY environment variable is missing. Please define it in your environment or Secrets tab.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API router / endpoints
  app.post("/api/review-referral", async (req, res) => {
    try {
      const { referralText } = req.body;
      if (!referralText || typeof referralText !== "string" || !referralText.trim()) {
        return res.status(400).json({ error: "Referral letter text is required" });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are an expert Clinical Software Architectural Assistant and Pregnancy Safety Evaluator.
Your client safety goal is to support junior antenatal intake midwives and clinic nurses in review tasks of unstructured GP antenatal referral letters.
You must extract info, identify potential risk factors, flag missing information, and advise safe review priority.

This is NOT a diagnostic tool. Your outputs must be highly cautious and clinical-facing.
Do not claim the app fully implements the guidelines, is validated, or replaces clinical judgement. Keep all outputs cautious and clinician-facing.

STRICT MEDICAL CLINICAL SAFETY RULES:
1. DO NOT DIAGNOSE or state that a patient has a condition with certainty.
2. DO NOT RECOMMEND TREATMENT, medications (e.g. aspirin, insulin), or specific dosages.
3. DO NOT REASSURE the clinician that a patient is safe or fully normal. Phrase all checks cautiously.
4. DO NOT invent, assume, or extrapolate any missing information. If information (such as LMP, EDD, height, weight, parity, or blood pressure) is not stated in the referral letter, you MUST say "Not stated in referral" or record it clearly as missing/unclear info.
5. USE CAUTIOUS CLINICAL LANGUAGE. Always use words like "possible risk factor", "may require review", "suggest clinician checks key criteria", "should be checked by a senior clinician". NEVER use definitive claims like "the patient is high risk" or "has pre-eclampsia".
6. URGENT RED FLAGS TRIGGER: Search the text carefully for severe symptoms or conditions such as: heavy bleeding, severe abdominal pain, seizures, severe headache, visual disturbances, suspected pre-eclampsia, reduced fetal movements, or severe hypertension (e.g. BP >= 160/110 or severe elevation).
   If any of these are present, you MUST:
   - Select suggestedPriority as "Escalate promptly for senior clinical review"
   - Under missingInfo or recommendedNextSteps, insist on immediate physical assessment or contact according to local emergency policies.
7. RECOMMENDED NEXT STEPS: Advise junior midwives/nurses to cross-reference with local guidelines, contact the patient to confirm key dates or symptoms if necessary, schedule relevant ultrasound/appointments, or consult senior clinical support.
8. GUIDELINE RATIONALE GROUNDING: Outline general rationale based on SA Health Perinatal Practice Guidelines (including the Decreased Fetal Movements guideline) and Australian Pregnancy Care Guidelines (Department of Health and Aged Care). You MUST conclude or state: "Based on general principles from SA Health Perinatal Practice Guidelines and Australian Pregnancy Care Guidelines, but local hospital policy and senior clinician judgement take priority." Do not claim the app fully implements the guidelines or has been validated.

Your suggestedPriority must be exactly one of the following three options:
- "Routine review likely appropriate"
- "Consider earlier review by senior clinician"
- "Escalate promptly for senior clinical review"`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          referralSummary: {
            type: Type.STRING,
            description: "A professional, objective 2-3 sentence summary of the patient's presentation and reasons for referral as stated in the letter."
          },
          possibleRisks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of possible pregnancy risk factors identified in the referral, phrased with cautious terminology ('Possible GDM history', 'Mention of potential history of pre-eclampsia')."
          },
          missingInfo: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of missing or unclear critical details. If basic info (e.g. LMP, EDD, blood pressure, BMI, parity) is not stated, list it explicitly as 'Last Menstrual Period (LMP) - Not stated in referral'."
          },
          suggestedPriority: {
            type: Type.STRING,
            description: "Must be exactly: 'Routine review likely appropriate', 'Consider earlier review by senior clinician', or 'Escalate promptly for senior clinical review'."
          },
          guidelineRationale: {
            type: Type.STRING,
            description: "Evidence-grounded rationale stating: 'Based on general principles from SA Health Perinatal Practice Guidelines and Australian Pregnancy Care Guidelines, but local hospital policy and senior clinician judgement take priority.' Warn that this is a prototype and not validated."
          },
          recommendedNextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific next action steps for junior midwives or nurses (e.g., arrange dating scan, contact GP for missing records, consult shift coordinator)."
          },
          safetyNote: {
            type: Type.STRING,
            description: "A prominent safety warning. E.g. 'All AI-generated insights must be verified against the physical letter and direct clinical history. Promptly escalate if active acute clinical red flags arise.'"
          }
        },
        required: [
          "referralSummary",
          "possibleRisks",
          "missingInfo",
          "suggestedPriority",
          "guidelineRationale",
          "recommendedNextSteps",
          "safetyNote"
        ]
      };

      const promptText = `Analyze the following GP antenatal referral letter. Provide a structured review ensuring maximum compliance with clinical safety rules:

--- START OF LETTER ---
${referralText}
--- END OF LETTER ---`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1,
        }
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("Empty response received from Gemini engine.");
      }

      const result = JSON.parse(textOutput.trim());
      return res.json(result);

    } catch (err: any) {
      console.error("Referral Analysis Error:", err);
      // Propagate the clean clinical error response back to client
      return res.status(500).json({
        error: err.message || "An error occurred while evaluating the antenatal referral."
      });
    }
  });

  // Serve static files / Vite middleware depending on mode
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production static mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Antenatal Risk Assistant backend is online at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start full-stack server:", error);
});
