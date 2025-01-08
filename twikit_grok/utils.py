import re

GROK_IMAGE_PROMPT_PATTERN = re.compile(r'GrokImagePrompt:\s*(.*?),(?=\s*GrokImageUpsampledPrompt:|$)', re.DOTALL)
GROK_IMAGE_UPSAMPLED_PROMPT_PATTERN = re.compile(r'GrokImageUpsampledPrompt:\s*(.*)', re.DOTALL)


def build_grok_history(items):
    h = []
    for item in reversed(items):
        sender_type = item['sender_type']
        if sender_type == 'User':
            sender = 1
        elif sender_type == 'Agent':
            sender = 2
        else:
            raise ValueError(f'Invalid sender type: {sender_type}')
        h.append({
            'message': item['message'],
            'sender': sender,
            'fileAttachments': item.pop('file_attachments', [])
        })
    return h


def extract_image_comment(data):
    MARKER = b'\xFF\xFE'
    index = data.find(MARKER)
    length = (data[index+2]<<8) + data[index+3] - len(MARKER)
    return data[index+4:index+4+length].decode()


def extract_image_prompts(image: bytes) -> tuple[str, str]:
    comment = extract_image_comment(image)
    grok_image_prompt = GROK_IMAGE_PROMPT_PATTERN.search(comment)
    grok_image_upsampled_prompt = GROK_IMAGE_UPSAMPLED_PROMPT_PATTERN.search(comment)
    return (
        grok_image_prompt.group(1),
        grok_image_upsampled_prompt.group(1)
    )
