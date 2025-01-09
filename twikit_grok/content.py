from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING

from .utils import extract_image_prompts

if TYPE_CHECKING:
    from .client import Client

class Attachment:
    def __init__(self, client: Client, data: dict) -> None:
        self._client = client
        self.url: str = data['imageUrl']
        self.media_id: str = data['mediaIdStr']
        self.file_name: str = data['fileName']
        self.mime_type: str = data['mimeType']
        self._bytes_cache = None

    async def fetch_bytes(self) -> bytes:
        if self._bytes_cache is not None:
            return self._bytes_cache
        file_bytes = await self._client.get_grok_image(self.url)
        self._bytes_cache = file_bytes
        return file_bytes

    async def get_prompts(self) -> tuple[str, str]:
        return extract_image_prompts(await self.fetch_bytes())

    async def download(self, file_path: str) -> None:
        file_bytes = await self.fetch_bytes()
        with open(file_path, 'wb') as f:
            f.write(file_bytes)

    def __repr__(self) -> str:
        return f'<Attachment media_id="{self.file_name}">'


class GeneratedContent:
    def __init__(self, client: Client, chunks: list[dict]) -> None:
        self.chunks = deepcopy(chunks)
        initial_chunk = chunks.pop(0)
        self.conversation_id: str = initial_chunk.get('conversationId')
        self.user_chat_item_id: str = initial_chunk.get('userChatItemId')
        self.agent_chat_item_id: str = initial_chunk.get('agentChatItemId')

        message = ''
        attachments: list[Attachment] = []
        follow_up_suggestions = []

        for chunk in chunks:
            if 'result' not in chunk:
                continue
            result = chunk['result']

            if 'message' in result:
                message += result['message']

            if 'imageAttachment' in result:
                attachments.append(Attachment(client, result['imageAttachment']))

            if 'followUpSuggestions' in result:
                follow_up_suggestions += result['followUpSuggestions']

        self.message = message
        self.attachments = attachments
        self.follow_up_suggestions = follow_up_suggestions

    def __repr__(self) -> str:
        return f'<GeneratedContent id="{self.user_chat_item_id}">'
