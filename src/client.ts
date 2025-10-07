import { Bun } from 'bun';
import { GrokConversation } from './conversation';
import { Endpoint, GROK_CONVERSATION_ITEMS_FEATURES } from './constants';
import type { ClientOptions, HistoryItem, RawGrokHistoryItem, StreamChunk, UploadedAttachment } from './types';

// A common public Bearer token for the Twitter/X internal API.
const GUEST_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

/**
 * The main client for interacting with the Grok API.
 * Re-implements the necessary functionality from twikit.Client using Bun's fetch.
 */
export class Client {
    private lang: string;
    private cookie: string;
    private csrfToken: string;
    private baseHeaders: Headers;

    constructor(options: ClientOptions = {}) {
        this.lang = options.lang || 'en-US';
        this.cookie = this.parseCookies(options.cookies);
        this.csrfToken = this.getCsrfToken(this.cookie);

        if (!this.csrfToken) {
            throw new Error('Failed to find "ct0" cookie, which is required for the CSRF token.');
        }

        this.baseHeaders = new Headers({
            'authorization': `Bearer ${GUEST_BEARER_TOKEN}`,
            'content-type': 'application/json',
            'cookie': this.cookie,
            'x-csrf-token': this.csrfToken,
            'x-twitter-active-user': 'yes',
            'x-twitter-client-language': this.lang,
        });
    }

    private parseCookies(cookies?: string | object): string {
        if (!cookies) return '';
        if (typeof cookies === 'string') {
            // If it's a path to a file, read it. Otherwise, use as is.
            // This is a simplification; we assume it's the cookie string itself.
            return cookies;
        }
        // Convert a cookie object to a string.
        return Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
    }

    private getCsrfToken(cookie: string): string {
        const match = cookie.match(/ct0=([a-f0-9]+)/);
        return match ? match[1] : '';
    }

    /**
     * Creates a new, empty Grok conversation.
     * @returns A new GrokConversation instance.
     */
    async createGrokConversation(): Promise<GrokConversation> {
        const response = await fetch(Endpoint.CREATE_GROK_CONVERSATION, {
            method: 'POST',
            headers: this.baseHeaders,
            body: JSON.stringify({}), // Empty body as per original
        });
        const data = await response.json();
        const conversationId = data?.data?.create_grok_conversation?.conversation_id;
        if (!conversationId) {
            throw new Error('Failed to create Grok conversation. Response was: ' + JSON.stringify(data));
        }
        return new GrokConversation(this, conversationId, []);
    }

    /**
     * Retrieves an existing Grok conversation by its ID.
     * @param id - The ID of the conversation to retrieve.
     * @returns A GrokConversation instance with its history loaded.
     */
    async getGrokConversation(id: string): Promise<GrokConversation> {
        const conversation = new GrokConversation(this, id);
        await conversation.loadHistory();
        return conversation;
    }

    /**
     * Fetches the raw message items for a given conversation ID.
     * This is used internally by GrokConversation.loadHistory().
     * @param id - The conversation rest_id.
     * @returns A list of raw conversation items.
     */
    async getGrokConversationItems(id: string): Promise<RawGrokHistoryItem[]> {
        const params = new URLSearchParams({
            'variables': JSON.stringify({ 'restId': id }),
            'features': JSON.stringify(GROK_CONVERSATION_ITEMS_FEATURES)
        });
        const url = `${Endpoint.GROK_CONVERSATION_ITEMS_BY_REST_ID}?${params}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: this.baseHeaders,
        });
        const data = await response.json();
        return data?.data?.grok_conversation_items_by_rest_id?.items || [];
    }

    /**
     * Uploads a file to be used as an attachment in a Grok conversation.
     * @param source - The path to the file or a Buffer/Blob of the file content.
     * @returns An object representing the uploaded attachment.
     */
    async uploadGrokAttachment(source: string | Buffer | Blob): Promise<UploadedAttachment> {
        const fileData = typeof source === 'string' ? await Bun.file(source).arrayBuffer() : source;
        const formData = new FormData();
        formData.append('image', new Blob([fileData]));

        const headers = new Headers(this.baseHeaders);
        headers.delete('content-type'); // Let fetch set the correct multipart boundary

        const response = await fetch(Endpoint.GROK_ATTACHMENT, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        return await response.json();
    }

    /**
     * Sends a message to a conversation and gets a streaming response.
     * This is an async generator method.
     * @returns An async generator that yields JSON chunks from the API.
     */
    async *grokAddResponse(
        responses: HistoryItem[],
        conversationId: string,
        model: string,
        imageGenerationCount: number
    ): AsyncGenerator<StreamChunk, void, unknown> {
        const data = {
            responses,
            systemPromptName: '',
            grokModelOptionId: model,
            conversationId,
            returnSearchResults: true,
            returnCitations: true,
            promptMetadata: {
                promptSource: 'NATURAL',
                action: 'INPUT'
            },
            imageGenerationCount,
            requestFeatures: {
                eagerTweets: true,
                serverHistory: true
            }
        };

        const headers = new Headers(this.baseHeaders);
        // The original used 'text/plain', which seems odd for a JSON body, but we'll stick to it.
        headers.set('content-type', 'text/plain;charset=UTF-8');

        // Replicate the 'X-Client-Transaction-Id' header
        // A simple UUID is a reasonable substitute without the original logic.
        headers.set('X-Client-Transaction-Id', crypto.randomUUID());

        const response = await fetch(Endpoint.GROK_ADD_RESPONSE, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            try {
                // The stream yields JSON objects, often one per chunk.
                yield JSON.parse(decoder.decode(value));
            } catch (e) {
                // It's possible for chunks not to be complete JSON objects,
                // so we'll log errors but continue. A more robust implementation
                // might buffer incomplete chunks.
                console.error("Failed to parse stream chunk:", decoder.decode(value), e);
            }
        }
    }

    /**
     * Fetches an image from a given URL.
     * @param url - The URL of the image to fetch.
     * @returns A Buffer containing the image data.
     */
    async getGrokImage(url: string): Promise<Buffer> {
        const response = await fetch(url, {
            method: 'GET',
            headers: this.baseHeaders,
        });
        return Buffer.from(await response.arrayBuffer());
    }
}