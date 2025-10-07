/**
 * Represents the options for initializing the Client.
 * This will hold credentials, cookies, and other settings.
 */
export interface ClientOptions {
  lang?: string;
  cookies?: string | object; // Path to cookie file or a cookie object/string
}

/**
 * Represents a file that has been uploaded to be used as an attachment.
 * The exact structure returned by the upload endpoint is not detailed in the
 * Python source. We will define it as `any` for now and refine it if more
 * information becomes available.
 */
export type UploadedAttachment = any;

/**
 * Represents an image attachment's data as received from the Grok API
 * within a stream chunk.
 */
export interface ApiImageAttachment {
  fileName: string;
  mimeType: string;
  mediaIdStr: string;
  imageUrl: string;
}

/**
 * Represents a single item in the conversation history that is sent to the API.
 */
export interface HistoryItem {
  message: string;
  sender: 1 | 2; // 1 for User, 2 for Agent
  fileAttachments: UploadedAttachment[];
}

/**
 * Represents a raw conversation item as received from the API's history endpoint.
 */
export interface RawGrokHistoryItem {
  sender_type: 'User' | 'Agent';
  message: string;
  file_attachments?: any[]; // The structure of this is not clear from the source.
}

/**
 * Represents the structure of a JSON chunk from the API's streaming response.
 */
export interface StreamChunk {
  conversationId?: string;
  userChatItemId?: string;
  agentChatItemId?: string;
  result?: {
    message?: string;
    imageAttachment?: ApiImageAttachment;
    followUpSuggestions?: string[];
  };
  // Other potential fields like 'error' could be added here.
}