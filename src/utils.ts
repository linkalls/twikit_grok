import type { RawGrokHistoryItem, HistoryItem } from './types';

// Regex patterns translated from Python's re module.
// The 's' flag is added to mimic Python's re.DOTALL behavior.
export const GROK_IMAGE_PROMPT_PATTERN = /GrokImagePrompt:\s*(.*?),(?=\s*GrokImageUpsampledPrompt:|$)/s;
export const GROK_IMAGE_UPSAMPLED_PROMPT_PATTERN = /GrokImageUpsampledPrompt:\s*(.*)/s;

/**
 * Builds the conversation history into the format expected by the Grok API.
 * @param items - Raw history items from the API.
 * @returns A formatted list of history items.
 */
export function buildGrokHistory(items: RawGrokHistoryItem[]): HistoryItem[] {
  const history: HistoryItem[] = [];
  // The original python code processes items in reverse order.
  for (const item of items.slice().reverse()) {
    let sender: 1 | 2;
    if (item.sender_type === 'User') {
      sender = 1;
    } else if (item.sender_type === 'Agent') {
      sender = 2;
    } else {
      // It's good practice to handle unexpected cases.
      throw new Error(`Invalid sender type: ${item.sender_type}`);
    }
    history.push({
      message: item.message,
      sender: sender,
      fileAttachments: item.file_attachments ?? []
    });
  }
  return history;
}

/**
 * Extracts the comment section from JPEG image data.
 * This is a TypeScript implementation of the Python byte manipulation logic.
 * @param data - The image data as a Buffer.
 * @returns The extracted comment string.
 */
export function extractImageComment(data: Buffer): string {
    const MARKER = Buffer.from([0xFF, 0xFE]); // JPEG Comment marker
    const index = data.indexOf(MARKER);
    if (index === -1) {
        return ""; // No comment found
    }
    // The length is stored in the two bytes following the marker (big-endian).
    // The length includes the 2 bytes for the length marker itself.
    // Python's logic was `(data[index+2]<<8) + data[index+3] - len(MARKER)`
    // but the length field in JPEG COM segment is the length of the comment payload plus the two length bytes.
    // Let's use Buffer's built-in methods for safety.
    const length = data.readUInt16BE(index + 2);
    const commentBytes = data.subarray(index + 4, index + 2 + length);
    return commentBytes.toString('utf-8');
}


/**
 * Extracts Grok image prompts from the comment of an image.
 * @param image - The image data as a Buffer.
 * @returns A tuple containing the standard prompt and the upsampled prompt.
 */
export function extractImagePrompts(image: Buffer): [string, string] {
    const comment = extractImageComment(image);
    const grokImagePromptMatch = comment.match(GROK_IMAGE_PROMPT_PATTERN);
    const grokImageUpsampledPromptMatch = comment.match(GROK_IMAGE_UPSAMPLED_PROMPT_PATTERN);

    const prompt = grokImagePromptMatch ? grokImagePromptMatch[1].trim() : "";
    const upsampledPrompt = grokImageUpsampledPromptMatch ? grokImageUpsampledPromptMatch[1].trim() : "";

    return [prompt, upsampledPrompt];
}