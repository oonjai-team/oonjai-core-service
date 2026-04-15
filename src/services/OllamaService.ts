import type {IService} from "@serv/IService"
import type {Activity} from "@entity/Activity"
import type {Senior} from "@entity/Senior"

export type PrecautionRisk = "none" | "medium" | "high"

export interface SeniorPrecaution {
  seniorId: string
  fullname: string
  risk: PrecautionRisk
  precaution: string
}

interface OllamaResponse {
  response: string
}

interface ModelPrecautionItem {
  seniorId?: string
  risk?: string
  precaution?: string
}

interface SeniorSignatureInput {
  seniorId: string
  fullname: string
  dateOfBirth: string
  mobilityLevel: string
  healthNote: string
}

export class OllamaService implements IService {
  private baseUrl: string
  private model: string
  private apiKey: string

  constructor(baseUrl: string, model: string, apiKey: string = "") {
    this.baseUrl = baseUrl.replace(/\/+$/, "")
    this.model = model
    this.apiKey = apiKey
  }

  public getServiceId(): string {
    return "OllamaService"
  }

  /** Stable signature over the inputs that would change the AI output.
   *  Caller uses this to decide whether a persisted cache entry is still valid. */
  public static buildSignature(seniors: Senior[]): string {
    const items = seniors.map(s => {
      const d = s.toDTO()
      return {
        seniorId: d.id ?? "",
        mobilityLevel: d.mobilityLevel ?? "",
        dateOfBirth: d.dateOfBirth ?? "",
        healthNote: d.healthNote ?? "",
      }
    })
    return [...items]
      .sort((a, b) => a.seniorId.localeCompare(b.seniorId))
      .map(s => `${s.seniorId}:${s.mobilityLevel}:${s.dateOfBirth}:${s.healthNote}`)
      .join("|")
  }

  public async generateActivityPrecautions(activity: Activity, seniors: Senior[]): Promise<SeniorPrecaution[]> {
    if (seniors.length === 0) return []

    const activityDTO = activity.toDTO()
    const seniorPayload: SeniorSignatureInput[] = seniors.map(s => {
      const d = s.toDTO()
      return {
        seniorId: d.id!,
        fullname: d.fullname,
        dateOfBirth: d.dateOfBirth,
        mobilityLevel: d.mobilityLevel,
        healthNote: d.healthNote ?? "",
      }
    })

    const prompt = this.buildPrompt(activityDTO, seniorPayload)

    let modelItems: ModelPrecautionItem[] = []
    try {
      modelItems = await this.callOllama(prompt)
    } catch (err) {
      console.error("[OllamaService] generate failed:", err)
      return seniorPayload.map(s => ({
        seniorId: s.seniorId,
        fullname: s.fullname,
        risk: "none" as PrecautionRisk,
        precaution: "AI precaution service is unavailable right now. Please review the activity details manually.",
      }))
    }

    return seniorPayload.map(s => {
      const match = modelItems.find(it => it.seniorId === s.seniorId)
      const risk = this.normaliseRisk(match?.risk)
      const precaution = (match?.precaution ?? "").trim() || "No specific precautions identified for this activity."
      return {
        seniorId: s.seniorId,
        fullname: s.fullname,
        risk,
        precaution,
      }
    })
  }

  private buildPrompt(activity: ReturnType<Activity["toDTO"]>, seniors: SeniorSignatureInput[]): string {
    const activityInfo = {
      title: activity.title,
      category: activity.category,
      tags: activity.tags,
      location: activity.location,
      duration: activity.duration,
      startDate: activity.startDate,
      endDate: activity.endDate,
    }

    return [
      "You are a clinical safety advisor for a senior-care booking platform.",
      "For each senior, assess the suitability of the given activity based on their date of birth, mobility level, and health notes,",
      "and produce a concise, professional medical precaution to share with their family caregiver.",
      "",
      "Output rules:",
      "- Return JSON ONLY: {\"items\":[{\"seniorId\":\"<id>\",\"risk\":\"none|medium|high\",\"precaution\":\"<text>\"}]}",
      "- One item per senior, using the exact seniorId values provided.",
      "- risk=high: the activity poses a clear clinical risk (e.g. cardiovascular disease, poorly-controlled diabetes, significant mobility impairment during physical activity, uncontrolled asthma at outdoor/high-pollen events).",
      "- risk=medium: noteworthy considerations requiring monitoring or minor adjustments (mild mobility limitations, managed chronic conditions, hearing or vision impairment, age-related fatigue, mild allergies).",
      "- risk=none: no clinically meaningful precautions indicated for this activity.",
      "",
      "Precaution text style:",
      "- 1–3 complete sentences, formal and professional tone suitable for a caregiver-facing document.",
      "- Reference the specific condition(s) from the senior's notes and link each precaution to a concrete aspect of this activity (e.g. duration, outdoor setting, physical intensity, environmental exposure).",
      "- Recommend specific, actionable steps (medication to bring, items to prepare, signs to watch for, when to seek assistance).",
      "- Do NOT use first-person pronouns, emojis, markdown, or colloquial language. Do not include the senior's name.",
      "- When risk is \"none\", still provide a brief one-sentence confirmation that the activity appears suitable and note any routine self-care reminders.",
      "",
      "Activity:",
      JSON.stringify(activityInfo),
      "",
      "Seniors:",
      JSON.stringify(seniors),
    ].join("\n")
  }

  private async callOllama(prompt: string): Promise<ModelPrecautionItem[]> {
    const headers: Record<string, string> = {"Content-Type": "application/json"}
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        format: "json",
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`ollama request failed (${res.status}): ${detail}`)
    }
    const data = (await res.json()) as OllamaResponse
    const parsed = JSON.parse(data.response) as {items?: ModelPrecautionItem[]}
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error("ollama response missing items array")
    }
    return parsed.items
  }

  private normaliseRisk(v: string | undefined): PrecautionRisk {
    const s = (v ?? "").toLowerCase().trim()
    if (s === "high") return "high"
    if (s === "medium" || s === "moderate" || s === "med") return "medium"
    return "none"
  }
}
