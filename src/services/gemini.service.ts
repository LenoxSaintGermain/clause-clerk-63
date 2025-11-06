import { GoogleGenerativeAI } from '@google/generative-ai';
import { Finding } from '@/types/finding.types';
import { v4 as uuidv4 } from 'uuid';

const GEMS = {
  aggressive: "Negotiate aggressively. Maximize protections for our side. Minimize obligations. Push back hard on liability, warranties, and termination rights.",
  riskAverse: "Identify ALL potential risks. Flag ambiguities. Ensure every obligation is crystal clear. Add protective language wherever possible.",
  saas: "Focus on SaaS-specific concerns: data ownership, uptime SLAs, security obligations, termination/transition, usage restrictions, pricing escalations.",
  vendor: "Review from vendor perspective. Protect our IP, limit liability, ensure payment terms are favorable, clarify scope to prevent scope creep.",
  customer: "Review from customer perspective. Ensure service levels, data rights, exit flexibility, and cost predictability. Challenge one-sided terms.",
  balanced: "Seek fair, balanced terms. Flag genuinely problematic clauses but maintain commercial reasonableness. Focus on deal-breaking issues."
};

export type GemPreset = keyof typeof GEMS;

export const getGemInstructions = (preset: GemPreset): string => GEMS[preset];

export const getAllGems = () => Object.keys(GEMS) as GemPreset[];

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });
  }

  isInitialized(): boolean {
    return this.model !== null;
  }

  getGemInstructions(preset: GemPreset): string {
    return GEMS[preset];
  }

  async analyzeContract(
    contractText: string,
    customInstructions?: string
  ): Promise<Finding[]> {
    if (!this.model) {
      throw new Error('Gemini service not initialized. Please provide your API key.');
    }

    const instructions = customInstructions || GEMS.balanced;

    const prompt = `You are an expert contract attorney conducting a thorough legal review.

CONTRACT TEXT:
${contractText}

REVIEW INSTRUCTIONS:
${instructions}

OUTPUT REQUIREMENTS:
- Return a JSON array of findings
- Each finding MUST contain:
  * originalText: The EXACT clause from the contract (word-for-word, including punctuation)
  * risk: Explain the legal/commercial risk in 1-2 clear sentences
  * suggestedRedline: Your improved version of the clause that mitigates the risk

- Focus on: liability caps, termination rights, indemnification, warranty limitations, payment terms, IP ownership, confidentiality, dispute resolution
- Prioritize findings by severity (high-risk first)
- Be specific—generic suggestions are useless
- Maintain professional legal drafting tone in redlines
- Maximum 20 findings per analysis (quality over quantity)

RESPONSE FORMAT (strict JSON):
[
  {
    "originalText": "Exact clause here",
    "risk": "Why this is problematic",
    "suggestedRedline": "Improved clause here"
  }
]`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const findings = JSON.parse(text) as Array<{
        originalText: string;
        risk: string;
        suggestedRedline: string;
      }>;

      return findings.map(finding => ({
        ...finding,
        id: uuidv4(),
        status: 'pending' as const
      }));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        }
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later.');
        }
      }
      throw new Error('Failed to analyze contract. Please try again.');
    }
  }

  async refineRedline(
    originalText: string,
    currentRedline: string,
    refinementInstruction: string
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini service not initialized. Please provide your API key.');
    }

    const prompt = `Original clause: ${originalText}
Current redline: ${currentRedline}

User refinement request: ${refinementInstruction}

Provide ONLY the refined clause text. No explanations, no JSON, just the improved text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      throw new Error('Failed to refine redline. Please try again.');
    }
  }
}

export const geminiService = new GeminiService();
