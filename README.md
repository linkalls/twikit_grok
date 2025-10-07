# twikit-grok-ts

A complete TypeScript rewrite of the original `twikit_grok` library, designed to run on [Bun](https://bun.sh/). This library provides a robust, type-safe client for interacting with the internal Grok API on X (formerly Twitter).

It allows you to programmatically create conversations, generate text and image responses, stream answers, and manage conversation history, all without dependencies on Python or the original `twikit` library.

## Features

- **Type-Safe:** Fully written in TypeScript for better developer experience and code quality.
- **Modern Tech:** Built on Bun, using its native `fetch` for HTTP requests.
- **Zero Python Dependencies:** A complete standalone rewrite.
- **Core Grok Functionality:**
    - Create and retrieve conversations.
    - Stream responses chunk by chunk.
    - Generate complete responses (non-streaming).
    - Upload and generate image attachments.
    - Download generated images and extract prompts.

## Installation

This package is available on both JSR (the JavaScript Registry) and NPM. For Bun and Deno users, **JSR is the recommended** choice.

### JSR (Recommended)
```bash
bunx jsr add @ptt/twikit-grok-ts
```

### NPM
```bash
bun add @potetotown/twikit-grok-ts
```

## Authentication

The library authenticates using your account's cookie. For security, it's highly recommended to provide the cookie via an environment variable rather than hardcoding it in your script.

Set the `TWITTER_COOKIE` environment variable to your full cookie string from your browser's developer tools (when logged into X.com).

```bash
export TWITTER_COOKIE='ct0=...; auth_token=...; ...'
```

The client will automatically use this environment variable if no cookie is passed to the constructor.

## Quick Start

Here’s a quick example of how to use the library. Make sure you have set the `TWITTER_COOKIE` environment variable before running.

```typescript
import { Client } from '@ptt/twikit-grok-ts';

// The client constructor will automatically use the `TWITTER_COOKIE`
// environment variable if the `cookies` option is not provided.
const client = new Client();

async function main() {
    try {
        console.log("Creating a new Grok conversation...");
        const conversation = await client.createGrokConversation();
        console.log(`New conversation created with ID: ${conversation.id}`);

        console.log("\nGenerating a response for 'What is Bun.sh?'...");
        const content = await conversation.generate('What is Bun.sh?');
        console.log("Grok's response:", content.message);

        console.log("\nGenerating an image of 'a teddy bear on a skateboard'...");
        const imageContent = await conversation.generate('a teddy bear on a skateboard');

        if (imageContent.attachments.length > 0) {
            const image = imageContent.attachments[0];
            const downloadPath = './skateboard_bear.jpg';
            console.log(`Image generated! Downloading to ${downloadPath}...`);
            await image.download(downloadPath);
            console.log("Download complete.");
        } else {
            console.log("Grok did not generate an image this time.");
        }

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
```