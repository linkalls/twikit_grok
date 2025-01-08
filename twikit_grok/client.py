from __future__ import annotations

import io
import json

import twikit
from twikit.utils import flatten_params

from .constants import GROK_CONVERSATION_ITEMS_FEATURES, Endpoint
from .conversation import GrokConversation


class Client(twikit.Client):
    async def create_grok_conversation(self):
        response, _ = await self.post(
            Endpoint.CREATE_GROK_CONVERSATION,
            headers=self._base_headers
        )
        conversation_id = response['data']['create_grok_conversation']['conversation_id']
        return GrokConversation(self, conversation_id, [])

    async def get_grok_conversation(self, id: str):
        conversation = GrokConversation(self, id)
        await conversation.load_history()
        return conversation

    async def get_grok_conversation_items(self, id: str):
        params = flatten_params({
            'variables': {'restId': id},
            'features': GROK_CONVERSATION_ITEMS_FEATURES
        })
        response, _ = await self.get(
            Endpoint.GROK_CONVERSATION_ITEMS_BY_REST_ID,
            params=params,
            headers=self._base_headers
        )
        return response['data']['grok_conversation_items_by_rest_id']['items']

    async def upload_grok_attachment(self, source: str | bytes):
        if isinstance(source, str):
            with open(source, 'rb') as file:
                binary = file.read()
        elif isinstance(source, bytes):
            binary = source
        file = io.BytesIO()
        file.write(binary)
        files = {'image': file}
        headers = self._base_headers
        headers.pop('content-type')
        response, _ = await self.post(
            Endpoint.GROK_ATTACHMENT,
            files=files,
            headers=headers
        )
        return response[0]

    async def grok_add_response(self, responses, conversation_id, model, image_generation_count):
        data = {
            'responses': responses,
            'systemPromptName': '',
            'grokModelOptionId': model,
            'conversationId': conversation_id,
            'returnSearchResults': True,
            'returnCitations': True,
            'promptMetadata': {
                'promptSource': 'NATURAL',
                'action': 'INPUT'
            },
            'imageGenerationCount': image_generation_count,
            'requestFeatures': {
                'eagerTweets': True,
                'serverHistory': True
            }
        }
        headers = self._base_headers
        headers['content-type'] = 'text/plain;charset=UTF-8'
        async with self.http.stream(
            'POST',
            Endpoint.GROK_ADD_RESPONSE,
            json=data,
            headers=headers,
            timeout=None
        ) as response:
            self._remove_duplicate_ct0_cookie()
            async for chunk in response.aiter_bytes():
                try:
                    yield json.loads(chunk.decode())
                except (UnicodeDecodeError, json.JSONDecodeError):
                    pass

    async def get_grok_image(self, url: str) -> bytes:
        res = await self.http.get(url, headers=self._base_headers)
        self._remove_duplicate_ct0_cookie()
        return res.content
