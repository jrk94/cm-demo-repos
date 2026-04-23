import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Dependencies, DI, TYPES } from "@criticalmanufacturing/connect-iot-controller-engine";

interface MCPServerConfig {
    name: string;
    url: string;
    headers?: Record<string, string>;
}

@DI.Injectable()
class LLMWithMCP {

    @DI.Inject(TYPES.Dependencies.Logger)
    private _logger: Dependencies.Logger;

    private openai: OpenAI;
    private mcpClients: Map<string, Client> = new Map();
    private availableTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
    private isStarted: boolean = false;

    async init(apiKey: string): Promise<this> {
        this._logger.info(`Initializing LLM with MCP: ${this.isStarted ? "Already Started" : "Starting"}`);
        if (!this.isStarted) {

            this.openai = new OpenAI({ apiKey });
            try {
                // await this.connectMCPServer({
                //     name: "mcp-mes",
                //     url: "http://mcp-mes:8080/mcp",
                //     headers: {
                //         "CMF-UserAccount": "admin",
                //     }
                // });

                // await this.connectMCPServer({
                //     name: "cubejsmcpserver",
                //     url: "http://mcp-cubejs:8080/mcp",
                //     headers: {
                //         "CMF-UserAccount": "admin",
                //     }
                // });

                // await this.connectMCPServer({
                //     name: "mcp-clickhouse",
                //     url: "http://mcp-clickhouse:8080/mcp",
                //     headers: {
                //         "CMF-UserAccount": "admin",
                //     }
                // });


                this._logger.debug("Connected servers:", this.getServerNames());
                this._logger.debug("Available tools:", this.getAvailableTools());
            } catch (e) {
                throw new Error((e as Error).message);
            }
            this.isStarted = true;
        }
        return this;
    }

    async connectMCPServer(serverConfig: MCPServerConfig): Promise<void> {
        const transport = new StreamableHTTPClientTransport(
            new URL(serverConfig.url),
            { requestInit: { headers: serverConfig.headers } }
        );

        const client = new Client(
            {
                name: `openai-client-${serverConfig.name}`,
                version: "1.0.0",
            },
            {
                capabilities: {},
            }
        );

        try {
            await client.connect(transport);
            this.mcpClients.set(serverConfig.name, client);

            // Fetch tools from this MCP server
            const { tools } = await client.listTools();

            // Convert MCP tools to OpenAI function format
            for (const tool of tools) {
                this.availableTools.push({
                    type: "function",
                    function: {
                        name: `${serverConfig.name}__${tool.name}`,
                        description: tool.description || "",
                        parameters: tool.inputSchema as Record<string, unknown>,
                    },
                });
            }

            this._logger.debug(`Connected to MCP server: ${serverConfig.name} (${serverConfig.url})`);
            this._logger.debug(`Added ${tools.length} tools`);
        } catch (e) {
            this._logger.error(`Failed to connect to MCP Server Agent: ${serverConfig.name} (${serverConfig.url}) - ${(e as Error).message}`);
            throw new Error(`Failed to connect to MCP Server Agent: ${serverConfig.name} (${serverConfig.url}) - ${(e as Error).message}`);
        }
    }

    async disconnectAll(): Promise<void> {
        for (const [name, client] of this.mcpClients) {
            await client.close();
            this._logger.debug(`Disconnected from MCP server: ${name}`);
        }
        this.mcpClients.clear();
        this.isStarted = false;
        this.availableTools = [];
    }

    private async callMCPTool(
        toolName: string,
        args: Record<string, unknown>
    ): Promise<string> {
        // Parse server name and tool name
        const [serverName, ...toolParts] = toolName.split("__");
        const actualToolName = toolParts.join("__");

        const client = this.mcpClients.get(serverName);
        if (!client) {
            throw new Error(`MCP server not found: ${serverName}`);
        }

        const result = await client.callTool({
            name: actualToolName,
            arguments: args,
        });

        // Convert MCP result to string
        if (result.content && Array.isArray(result.content)) {
            return result.content
                .map((item) => {
                    if (item.type === "text") {
                        return item.text;
                    }
                    return JSON.stringify(item);
                })
                .join("\n");
        }

        return JSON.stringify(result);
    }

    async chat(
        messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        options: {
            model?: string;
            maxIterations?: number;
            temperature?: number;
            systemPrompt?: string;
        } = {}
    ): Promise<string> {

        const model = options.model || "gpt-4-turbo-preview";
        const maxIterations = options.maxIterations || 10;

        let currentMessages = [...messages];
        if (options.systemPrompt) {
            // Add system message at the beginning
            currentMessages = [
                { role: "system", content: options.systemPrompt },
                ...messages
            ];
        }
        let iterations = 0;

        while (iterations < maxIterations) {
            iterations++;

            const completion = await this.openai.chat.completions.create({
                model,
                messages: currentMessages,
                temperature: options.temperature,
                tools: this.availableTools.length > 0 ? this.availableTools : undefined,
            });

            const message = completion.choices[0].message;
            this._logger.debug(`Messages iteration ${iterations + "/" + maxIterations}:${message}`);
            currentMessages.push(message);

            // If no tool calls, we're done
            if (!message.tool_calls || message.tool_calls.length === 0) {
                this._logger.warning(`${JSON.stringify(message)}`);
                return message.content || "";
            }

            // Execute all tool calls in parallel
            const toolResults = await Promise.allSettled(
                message.tool_calls.map(async (toolCall) => {
                    try {
                        const args = JSON.parse((toolCall as any).function.arguments);

                        this._logger.debug(`Tool: Calling tool name:${(toolCall as any).function.name} and args: ${JSON.stringify(args)}`);
                        const result = await this.callMCPTool((toolCall as any).function.name, args);

                        return {
                            role: "tool" as const,
                            tool_call_id: toolCall.id,
                            content: result,
                        };
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this._logger.debug(`Tool: Calling tool with error name:${(toolCall as any).function.name} and error message: ${errorMessage}`);
                        return {
                            role: "tool" as const,
                            tool_call_id: toolCall.id,
                            content: `Error: ${errorMessage}`,
                        };
                    }
                })
            );

            // Add all tool results to messages
            for (const result of toolResults) {
                if (result.status === "fulfilled") {
                    this._logger.debug(`Tool: Messages iteration ${iterations + "/" + maxIterations}:${JSON.stringify(result.value)}`);
                    currentMessages.push(result.value);
                }
            }
        }

        throw new Error(`Max iterations (${maxIterations}) reached`);
    }

    getAvailableTools(): string[] {
        return this.availableTools.map(t => (t as any).function.name);
    }

    getServerNames(): string[] {
        return Array.from(this.mcpClients.keys());
    }
}

export { LLMWithMCP, MCPServerConfig };