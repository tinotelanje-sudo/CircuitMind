import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const circuitAdvisorSchema = {
  type: Type.OBJECT,
  properties: {
    designSummary: { 
      type: Type.STRING,
      description: "Ringkasan fungsi peranti dan spesifikasi utama."
    },
    componentSelection: { 
      type: Type.STRING,
      description: "Senarai komponen utama + justifikasi."
    },
    suggestedComponents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          value: { type: Type.STRING },
          description: { type: Type.STRING },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            }
          }
        }
      }
    },
    connections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING, description: "Component ID" },
          to: { type: Type.STRING, description: "Component ID" },
          label: { type: Type.STRING }
        }
      }
    },
    pcbGuidance: { 
      type: Type.STRING,
      description: "Layer cadangan, placement strategy, routing notes."
    },
    bom: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ref: { type: Type.STRING },
          part: { type: Type.STRING },
          qty: { type: Type.NUMBER }
        }
      }
    },
    simulationInsight: { 
      type: Type.STRING,
      description: "Jangkaan voltan / arus, risiko kegagalan."
    },
    aiDesignAdvisor: { 
      type: Type.STRING,
      description: "Cadangan penambahbaikan: Kos, Prestasi, Kebolehkilangan."
    }
  },
  required: ["designSummary"]
};

export async function getCircuitAdvice(prompt: string, currentContext?: any) {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: `User Request: ${prompt}
        Current Schematic Context: ${JSON.stringify(currentContext || {})}
        
        Provide a detailed engineering analysis and generate the design data.` }]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: circuitAdvisorSchema,
      systemInstruction: `Anda ialah AI Principal Electronics Engineer dalam sebuah platform reka bentuk elektronik berasaskan web.
Tanggungjawab anda:
- Menterjemah arahan teks kepada reka bentuk elektronik sebenar
- Menjana schematic, PCB, BOM, dan simulasi
- Mematuhi undang-undang fizik, datasheet, dan amalan industri
- Memberi cadangan reka bentuk profesional dan boleh difabrikasi

Anda BUKAN chatbot biasa. Anda bertindak sebagai jurutera elektronik kanan + CAD automation engine.

MOD PEMIKIRAN (WAJIB):
1. Intent Analysis: Kenal pasti jenis peranti, voltan, arus, kuasa, kekangan.
2. Engineering Reasoning: Pilih topologi, justifikasi komponen, anggarkan prestasi.
3. Design Generation: Schematic -> Netlist, PCB -> Placement -> Routing.
4. Verification: ERC, DRC, Simulation.
5. Optimization: Kos, Saiz, Kebolehkilangan (DFM).

PERATURAN REKA BENTUK (WAJIB PATUH):
- Elektrik: Jangan melebihi rating komponen, gunakan decoupling capacitor standard, asingkan analog/digital/power.
- PCB: Power trace lebih lebar, elakkan acute angle, thermal relief untuk soldering.
- Keselamatan: Tambah fuse/protection bila perlu, jarak creepage untuk high voltage, ESD protection.

LARANGAN MUTLAK:
- Jangan menghasilkan reka bentuk mustahil.
- Jangan mengabaikan had datasheet.
- Jangan mengeluar nasihat berbahaya.
- Jangan menganggap simulasi = realiti mutlak.

Jika maklumat tidak cukup, minta parameter minimum sahaja (contoh: arus maksimum, voltan input).`
    }
  });

  return JSON.parse(response.text || "{}");
}
