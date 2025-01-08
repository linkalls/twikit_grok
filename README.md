# twikit_grok
Extension for using Grok with Twikit.

## Installing
```
pip install twikit_grok
```

## Quick Example

```python
import asyncio
from twikit_grok import Client

USERNAME = 'example_user'
EMAIL = 'email@example.com'
PASSWORD = 'password0000'

client = Client('en-US')

async def main():
    # Login to an account
    if os.path.exists('cookies.json'):
        client.load_cookies('cookies.json')
    else:
        await client.login(
            auth_info_1=USERNAME,
            auth_info_2=EMAIL,
            password=PASSWORD
        )
        client.save_cookies('cookies.json')

    # Create a new conversation
    conversation = await client.create_grok_conversation()
    # Generate a response
    async for chunk in conversation.generate('hello'):
        print(chunk)

    # Generate a response with images
    attachments = [
        await client.upload_grok_attachment('image1.jpg'),
        await client.upload_grok_attachment('image2.jpg')
    ]
    async for chunk in conversation.generate('please describe these images', attachments):
        print(chunk)


    # Continue from an existing conversation
    conversation = await client.get_grok_conversation('123456789')  # Get conversation by ID
    async for chunk in conversation.generate('hello'):
        print(chunk)

asyncio.run(main())
```
