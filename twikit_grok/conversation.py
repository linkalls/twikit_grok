from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING, AsyncGenerator

from .utils import build_grok_history, extract_image_prompts

if TYPE_CHECKING:
    from .client import Client


class GrokConversation:
    def __init__(self, client: Client, id: str, history: list | None = None) -> None:
        self._client = client
        self.id = id
        self.history = history

    async def load_history(self):
        items = await self._client.get_grok_conversation_items(self.id)
        history = build_grok_history(items)
        self.history = history

    async def generate(
        self,
        message,
        file_attachments: list | None = None,
        model: str = 'grok-2a',
        image_generation_count: int = 4
    ) -> AsyncGenerator[dict, None, None]:
        """
        Parameters
        ----------
        message : str
            The message that will be sent to generate a response.
        file_attachments : list | None, default=None
            A list of file attachments to send along with the message.
        model : str, default='grok-2a'
            The model to use for generating the response.
        image_generation_count : int, default='4'
            The number of images to generate.
        """
        responses = deepcopy(self.history)
        if file_attachments is None:
            file_attachments = []
        responses.append({
            'message': message,
            'sender': 1,
            'promptSource': '',
            'fileAttachments': file_attachments
        })
        response_message = ''
        response_attachments = []
        async for res in self._client.grok_add_response(responses, self.id, model, image_generation_count):
            yield res
            if 'result' not in res:
                continue
            result = res['result']
            if 'message' in result:
                response_message += result['message']
            if 'imageAttachment' in result:
                image_attachment = result['imageAttachment']
                response_attachments.append({
                    'fileName': image_attachment['fileName'],
                    'mimeType': image_attachment['mimeType'],
                    'mediaId': image_attachment['mediaIdStr'],
                    'url': image_attachment['imageUrl']
                })
        if response_attachments:
            image_url = response_attachments[0]['url']
            image_bytes = await self._client.get_grok_image(image_url)
            prompt, _ = extract_image_prompts(image_bytes)
            response_message = f"I generated images with the prompt: '{prompt}'"

        self.history.append({
            'message': message,
            'sender': 1,
            'fileAttachments': file_attachments
        })
        self.history.append({
            'message': response_message,
            'sender': 2,
            'fileAttachments': response_attachments
        })

    def __repr__(self) -> str:
        return f'<GrokConversation id="{self.id}">'
