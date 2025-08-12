export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}

export interface AudioTranscriptionService {
  transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult>;
  isAvailable(): Promise<boolean>;
}

export class ClientAudioTranscriptionService implements AudioTranscriptionService {
  private readonly endpoint: string;

  constructor(endpoint: string = "/api/transcribe") {
    this.endpoint = endpoint;
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error("Audio blob is empty");
    }

    const formData = new FormData();
    // Determine file extension based on blob type
    const cleanType = audioBlob.type.split(';')[0]; // Remove codec info
    let extension = 'webm'; // default
    
    if (cleanType.includes('mp4')) {
      extension = 'mp4';
    } else if (cleanType.includes('ogg')) {
      extension = 'ogg';
    } else if (cleanType.includes('wav')) {
      extension = 'wav';
    } else if (cleanType.includes('mpeg')) {
      extension = 'mp3';
    } else if (cleanType.includes('webm')) {
      extension = 'webm';
    }
    
    formData.append("audio", audioBlob, `recording.${extension}`);

    const response = await fetch(this.endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.text) {
      throw new Error("No transcription text received");
    }

    return {
      text: result.text.trim(),
      confidence: result.confidence,
      language: result.language,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.endpoint, { method: "GET" });
      if (!response.ok) return false;
      const data = await response.json();
      return !!data?.ok;
    } catch {
      return false;
    }
  }
}