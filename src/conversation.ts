import { GeneratedContent } from './content';
import { buildGrokHistory } from './utils';
import type { Client } from './client';
import type { HistoryItem, UploadedAttachment, StreamChunk } from './types';

/**
 * Represents and manages a single conversation with Grok.
 */
export class GrokConversation {
    private _client: Client;
    public id: string;
    public history: HistoryItem[];

    constructor(client: Client, id: string, history: HistoryItem[] = []) {
        this._client = client;
        this.id = id;
        this.history = history;
    }

    /**
     * Loads the past messages for this conversation from the API.
     */
    public async loadHistory(): Promise<void> {
        // Relies on a `getGrokConversationItems` method we will define on the Client.
        const items = await this._client.getGrokConversationItems(this.id);
        this.history = buildGrokHistory(items);
    }

    /**
     * Streams the response from Grok for a given message.
     * This is an async generator that yields each chunk of the response.
     *
     * @param message - The message to send.
     * @param fileAttachments - A list of uploaded attachments to include.
     * @param model - The model to use for the response.
     * @param imageGenerationCount - The number of images to generate if requested.
     * @returns An async generator yielding stream chunks.
     */
    public async *stream(
        message: string,
        fileAttachments: UploadedAttachment[] = [],
        model: string = 'grok-2a',
        imageGenerationCount: number = 4
    ): AsyncGenerator<StreamChunk, void, unknown> {
        // Deep copy history to avoid mutation before the stream is complete.
        const responses = JSON.parse(JSON.stringify(this.history));
        responses.push({
            message: message,
            sender: 1, // User
            promptSource: '', // As in original code
            fileAttachments: fileAttachments,
        });

        let responseMessage = '';
        let responseAttachments: any[] = []; // Using any to match Python flexibility for now

        // Relies on a `grokAddResponse` method we will define on the Client.
        const stream = this._client.grokAddResponse(responses, this.id, model, imageGenerationCount);

        for await (const chunk of stream) {
            yield chunk; // Yield the raw chunk first.

            if (!chunk.result) {
                continue;
            }
            const { result } = chunk;

            if (result.message) {
                responseMessage += result.message;
            }
            if (result.imageAttachment) {
                // Collect attachment data as it arrives.
                responseAttachments.push({
                    fileName: result.imageAttachment.fileName,
                    mimeType: result.imageAttachment.mimeType,
                    mediaId: result.imageAttachment.mediaIdStr,
                    url: result.imageAttachment.imageUrl,
                });
            }
        }

        // The original Python code had special logic for image generation prompts.
        if (responseAttachments.length > 0 && responseAttachments[0].url) {
            // This logic might need adjustment. The original code fetched the image
            // to extract a prompt, which might not be the most efficient way.
            // For now, we replicate the idea that the message gets updated.
            const imageBytes = await this._client.getGrokImage(responseAttachments[0].url);
            // Assuming extractImagePrompts is available and works on the buffer.
            // Let's import it.
            const { extractImagePrompts } = await import('./utils');
            const [prompt, _] = extractImagePrompts(imageBytes);
            if (prompt) {
                responseMessage = `I generated images with the prompt: '${prompt}'`;
            }
        }

        // Now, update the official history.
        this.history.push({
            message: message,
            sender: 1,
            fileAttachments: fileAttachments,
        });
        this.history.push({
            message: responseMessage,
            sender: 2, // Agent
            fileAttachments: responseAttachments,
        });
    }

    /**
     * Generates a complete response, consuming the entire stream.
     * @param message - The message to send.
     * @param fileAttachments - A list of uploaded attachments to include.
     * @param model - The model to use for the response.
     * @param imageGenerationCount - The number of images to generate if requested.
     * @returns A Promise that resolves to a GeneratedContent object.
     */
    public async generate(
        message: string,
        fileAttachments: UploadedAttachment[] = [],
        model: string = 'grok-2a',
        imageGenerationCount: number = 4
    ): Promise<GeneratedContent> {
        const chunks: StreamChunk[] = [];
        for await (const chunk of this.stream(message, fileAttachments, model, imageGenerationCount)) {
            chunks.push(chunk);
        }
        return new GeneratedContent(this._client, chunks);
    }

    public toString(): string {
        return `<GrokConversation id="${this.id}">`;
    }
}