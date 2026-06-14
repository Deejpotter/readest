import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel, EmbeddingModel } from 'ai';
import type { AIProvider, AISettings, AIProviderName } from '../types';
import { aiLogger } from '../logger';
import { AI_TIMEOUTS } from '../utils/retry';
import { getAIFetch } from '../utils/httpFetch';

const DEFAULT_BASE_URL = 'https://opencode.ai/zen/v1';
const DEFAULT_MODEL = 'mimo-v2.5-free';
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/**
 * Provider for OpenCode Zen — a curated list of models provided by the OpenCode team.
 * Uses the OpenAI-compatible API format at https://opencode.ai/zen/v1.
 *
 * Transport: every outbound HTTP call is routed through {@link getAIFetch} so
 * that in the Tauri app it goes via the Rust `@tauri-apps/plugin-http` transport.
 */
export class OpenCodeZenProvider implements AIProvider {
  id: AIProviderName = 'opencode-zen';
  name = 'OpenCode Zen';
  requiresAuth = true;

  private settings: AISettings;
  private client: ReturnType<typeof createOpenAICompatible>;
  private baseUrl: string;
  private apiKey: string;
  private httpFetch: typeof fetch;

  constructor(settings: AISettings) {
    this.settings = settings;
    if (!settings.opencodeZenApiKey) {
      throw new Error('OpenCode Zen API key required');
    }
    this.apiKey = settings.opencodeZenApiKey;
    this.baseUrl = (settings.opencodeZenBaseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.httpFetch = getAIFetch();
    this.client = createOpenAICompatible({
      name: 'opencode-zen',
      baseURL: this.baseUrl,
      apiKey: this.apiKey,
      headers: {
        'HTTP-Referer': 'https://readest.com',
        'X-Title': 'Readest',
      },
      fetch: this.httpFetch,
    });
    aiLogger.provider.init('opencode-zen', settings.opencodeZenModel || DEFAULT_MODEL);
  }

  getModel(): LanguageModel {
    const modelId = this.settings.opencodeZenModel || DEFAULT_MODEL;
    return this.client.chatModel(modelId);
  }

  getEmbeddingModel(): EmbeddingModel {
    const modelId = this.settings.opencodeZenEmbeddingModel || DEFAULT_EMBEDDING_MODEL;
    return this.client.textEmbeddingModel(modelId);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const modelId = this.settings.opencodeZenModel || DEFAULT_MODEL;
      aiLogger.provider.init('opencode-zen', `healthCheck starting with model: ${modelId}`);
      const response = await this.httpFetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(AI_TIMEOUTS.HEALTH_CHECK),
      });
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      aiLogger.provider.init('opencode-zen', 'healthCheck success');
      return true;
    } catch (e) {
      aiLogger.provider.error('opencode-zen', `healthCheck failed: ${(e as Error).message}`);
      return false;
    }
  }
}
