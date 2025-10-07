/**
 * This is an example of how to use the twikit-grok-ts library.
 *
 * To run this example:
 * 1. Make sure you have Bun installed.
 * 2. Set your Twitter/X cookie as an environment variable.
 *    For example, in your terminal:
 *    export TWITTER_COOKIE='ct0=YOUR_CT0_TOKEN; auth_token=YOUR_AUTH_TOKEN; ...'
 * 3. Run the script from the root directory of the project:
 *    bun run examples/quick-start.ts
 */
import { Client } from '../src/index';

// --- Configuration ---
// It is recommended to load your cookie from an environment variable for security.
const COOKIE_STRING = process.env.TWITTER_COOKIE || '';

if (!COOKIE_STRING) {
    console.error("Error: The TWITTER_COOKIE environment variable is not set.");
    console.error("Please set it to your full Twitter/X cookie string.");
    console.error("Example: export TWITTER_COOKIE='ct0=...; auth_token=...; ...'");
    process.exit(1);
}

// --- Main Execution Logic ---
async function main() {
    console.log("🚀 Initializing Grok client...");
    const client = new Client({
        cookies: COOKIE_STRING,
    });
    console.log("✅ Client initialized successfully.");

    try {
        // 1. Create a new conversation
        console.log("\n--- 1. Creating a new conversation ---");
        const conversation = await client.createGrokConversation();
        console.log(`📄 New conversation created with ID: ${conversation.id}`);

        // 2. Stream a simple text response
        console.log("\n--- 2. Streaming a response for 'Hello, Grok!' ---");
        process.stdout.write("Grok's response: ");
        for await (const chunk of conversation.stream('Hello, Grok!')) {
            // The message arrives in chunks, so we print it as it comes.
            process.stdout.write(chunk.result?.message || "");
        }
        process.stdout.write("\n--- End of stream ---\n");

        // 3. Generate a complete response (non-streaming) for a question
        console.log("\n--- 3. Generating a full response for 'What is the speed of light?' ---");
        const content = await conversation.generate('What is the speed of light?');
        console.log(`💬 Grok's full message: ${content.message}`);
        if (content.followUpSuggestions.length > 0) {
            console.log("🤔 Follow-up suggestions:", content.followUpSuggestions);
        }

        // 4. Generate an image and download it
        console.log("\n--- 4. Generating an image of 'a cute robot reading a book' ---");
        const imageContent = await conversation.generate('a cute robot reading a book');

        if (imageContent.attachments.length > 0) {
            const firstAttachment = imageContent.attachments[0];
            console.log(`🖼️ Image generated: ${firstAttachment.fileName}`);
            const downloadPath = './robot_book.jpg';
            await firstAttachment.download(downloadPath);
            console.log(`💾 Image downloaded to: ${downloadPath}`);

            const [prompt, _] = await firstAttachment.getPrompts();
            console.log(`🎨 The prompt used for generation was: '${prompt}'`);
        } else {
            console.log("⚠️ No image was generated. Grok's response was:", imageContent.message);
        }

        // 5. Continue the same conversation
        console.log(`\n--- 5. Continuing conversation ${conversation.id} ---`);
        const finalContent = await conversation.generate('Thank you for your help!');
        console.log(`💬 Grok's final response: ${finalContent.message}`);
        console.log("\n✅ Example script finished successfully!");

    } catch (error) {
        console.error("\n❌ An error occurred during the demonstration:", error);
        process.exit(1);
    }
}

main();