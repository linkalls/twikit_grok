import re

from setuptools import setup

with open('README.md', encoding='utf-8') as f:
    long_description = f.read()

with open('./twikit_grok/__init__.py') as f:
    version = re.findall(r"__version__ = '(.+)'", f.read())[0]

setup(
    name='twikit_grok',
    version=version,
    install_requires=[
        'twikit'
    ],
    python_requires='>=3.8',
    description='Twikit Grok',
    long_description=long_description,
    long_description_content_type='text/markdown',
    license='MIT',
    url='https://github.com/d60/twikit_grok',
    package_data={'twikit_grok': ['py.typed']}
)
