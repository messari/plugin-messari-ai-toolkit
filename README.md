# @elizaos/plugin-messari-copilot

A plugin that integrates Messari's AI Copilot capabilities into ElizaOS agents, providing market research and crypto data analysis functionality.

## Description

The Messari Copilot plugin enables agents to answer questions about cryptocurrency markets, protocols, and on-chain data by leveraging Messari's AI-powered API. It automatically detects research questions in conversations and provides detailed, data-driven responses.

## Installation

```bash
pnpm install @elizaos/plugin-messari-copilot
```

## Configuration

The plugin requires a Messari API key to function. Set it in your environment variables:

```bash
export MESSARI_API_KEY=your_api_key_here
```

Or add it to your `.env` file:

```
MESSARI_API_KEY=your_api_key_here
```

## Features

### Research Question Detection

- Automatically identifies questions about:
    - Market data and statistics
    - Rankings and comparisons
    - Historical data and trends
    - Protocol and token analysis
    - Financial performance metrics

### Intelligent Response Generation

- Processes natural language queries
- Provides data-driven answers
- Handles multiple question types
- Maintains conversation context

## Usage

The plugin works automatically once installed and configured. It will:

1. Monitor conversations for research questions
2. Process relevant messages through Messari's AI
3. Return detailed, data-backed responses

Example questions it can handle:

- "What are the top 10 L2s by fees?"
- "Show me ETH price"
- "What's the TVL of Arbitrum?"

## Development

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Build the plugin:

```bash
pnpm run build
```

4. Run linting:

```bash
pnpm run lint
```

## Dependencies

- @elizaos/core: workspace:\*

## Error Handling

The plugin includes robust error handling for:

- Missing API keys
- API rate limits
- Network failures
- Invalid responses

All errors are properly logged for debugging.

## Contributing

Contributions are welcome! Please ensure your pull requests:

1. Include appropriate tests
2. Update documentation
3. Follow the existing code style
4. Handle errors appropriately

## License

This plugin is part of the Eliza project. See the main project repository for license information.
