import { appendResponseMessages, streamText, tool, generateObject } from "ai";

import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { NextRequest } from "next/server";

import { createClient } from "../../utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { messages, chatId } = await req.json();

  // Get the user from the request

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    console.error("User not found");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const result = streamText({
    model: openai("gpt-4o-mini"),
    maxSteps: 1,
    system: `
    You are Askivue — a smart, very polite, and friendly AI assistant who transforms natural language into beautiful visual insights. 
    Your job is to help users turn text and data into clear charts — while keeping things simple, helpful, and kind.

    🧠 Behavior Guidelines:
     - You specialize in:
        - Creating pie charts, bar charts, and data tables  
        - Providing up-to-date cryptocurrency price information
    - Never mention, reveal, or discuss the tools, libraries, frameworks, or technologies you use (e.g., ECharts, JavaScript, etc.). If asked, respond kindly but say it's not something you can share.
    - Always assume the user wants to understand or visualize their data.
    - Use the appropriate tool to generate one of the following:
      - Pie charts
      - Bar charts
      - Cryptocurrency price information
    - When responding with cryptocurrency data, always use up-to-date info from reliable exchange APIs and mention the currency name and value clearly.
    - Never mention, reveal, or discuss the tools, libraries, frameworks, or technologies you use (e.g., ECharts, JavaScript, etc.). If asked, respond kindly but say it's not something you can share.
    - If the chart type is unclear, ask a friendly follow-up (e.g., “Would you like a bar chart for this?”).
    - If users ask for style changes (title, color, chart type), respond flexibly using updated chart options.
    - Do not use or mention unsupported chart types (like line charts). If asked, gently explain the current limitation and suggest the closest supported alternative.
    - When appropriate, offer short insights or observations in plain language based on the data.

    🌐 Brand Tone:
    - Always friendly, clear, and professional — like a helpful data-savvy friend.
    - Keep explanations short and kind. Avoid technical jargon.
    - Invite interaction and exploration (e.g., “Want to add another column?” or “Would you like this as a pie chart instead?”).
    - Avoid technical jargon. Keep answers human-centered and clear.

    🎯 Core Focus:
    - Turn messy or vague input into clean visual output — instantly.
    - Make chart creation feel easy, fast, and magical.
    - Only respond with chart tools, crypto price info, or helpful replies — never markdown, raw JSON, or implementation details.
    - Make chart creation feel magical. Make crypto prices feel instant.
    - Always use the right tool to create visual output when the user provides structured or numerical data.

    You are not a general chatbot. You specialize in transforming natural language into visual data insight and cryptocurrency price information— through charts only.

    `,
    messages,

    tools: {
      generatePieChart: tool({
        description: `Use this tool to generate visual pie chart configurations (ECharts-compatible) whenever the user asks to view data as a pie chart
        
        ✅ Required for:
        - Pie charts
        - Any structured or numerical data the user provides

        🧠 Behavior:
        - Support only: "pie" types.
        - Always ask for the chart type if not specified.
        - Always ask for color and if the user doesn't ask for color, use the default color.
        - Always confirm the information provided by the user before generating the chart.
        - Always suggest the closest supported alternative if the chart type is unclear.
        The goal is to help the user go from text to visual insights — fast and seamlessly.
        `,
        parameters: z.object({
          title: z.string().optional().describe("The pie chart title"),
          seriesData: z
            .array(
              z.object({
                name: z.string().describe("Series name"),
                value: z.number().describe("Series value"),
                color: z
                  .string()
                  .describe(
                    "Series color. Always ask for color and if the user doesn't ask for color, use the default color."
                  ),
              })
            )
            .optional()
            .describe("Series data with optional color"),
          backgroundColor: z
            .string()
            .optional()
            .default("#52525c")
            .describe("Background color of the chart"),
          textColor: z
            .string()
            .optional()
            .default("#fff")
            .describe("Text color of the chart"),
        }),
        execute: async ({ title, seriesData, backgroundColor, textColor }) => {
          try {
            const { object } = await generateObject({
              model: openai("gpt-4o-mini"),
              schema: z.object({
                title: z.string().optional(),
                seriesData: z
                  .array(
                    z.object({
                      name: z.string().describe("Series name"),
                      value: z.number().describe("Series value"),
                      color: z
                        .string()
                        .describe(
                          "Series color. Always ask for color and if the user doesn't ask for color, use the default color."
                        ),
                    })
                  )
                  .optional(),
                backgroundColor: z
                  .string()
                  .optional()
                  .default("#52525c")
                  .describe("Background color of the chart"),
                textColor: z
                  .string()
                  .optional()
                  .default("#fff")
                  .describe("Text color of the chart"),
              }),
              prompt: `Generate ECharts-compatible option config for a pie chart based on schema and this description:\n\nTitle: ${
                title ?? ""
              }\nSeries data: ${JSON.stringify(
                seriesData ?? [],
                null,
                2
              )}\nBackground color: ${backgroundColor ?? ""}\nText color: ${
                textColor ?? ""
              }`,
            });
            return {
              chartData: object,
            };
          } catch (error) {
            console.log("error", error);
            return error;
          }
        },
      }),

      generateBarChart: tool({
        description: `Use this tool to generate visual bar chart configurations (ECharts-compatible) whenever the user asks to view data as a bar chart
        
        ✅ Required for:
        - Bar charts
        - Any structured or numerical data the user provides

        🧠 Behavior:
        - Support only: "bar" types.
        - Always ask for the chart type if not specified.
        - Always ask for color and if the user doesn't ask for color, use the default color.
        - Always confirm the information provided by the user before generating the chart.
        - Always suggest the closest supported alternative if the chart type is unclear.
        The goal is to help the user go from text to visual insights — fast and seamlessly.
        `,
        parameters: z.object({
          title: z.string().optional().describe("The bar chart title"),
          seriesData: z
            .array(
              z.object({
                name: z.string().describe("Series name"),
                value: z.number().describe("Series value"),
                color: z
                  .string()
                  .describe(
                    "Series color. Always ask for color and if the user doesn't ask for color, use the default color."
                  ),
              })
            )
            .optional()
            .describe("Series data with optional color"),
          backgroundColor: z
            .string()
            .optional()
            .default("#52525c")
            .describe("Background color of the chart"),
          textColor: z
            .string()
            .optional()
            .default("#fff")
            .describe("Text color of the chart"),
        }),
        execute: async ({ title, seriesData, backgroundColor, textColor }) => {
          try {
            const { object } = await generateObject({
              model: openai("gpt-4o-mini"),
              schema: z.object({
                title: z.string().optional(),
                seriesData: z
                  .array(
                    z.object({
                      name: z.string().describe("Series name"),
                      value: z.number().describe("Series value"),
                      color: z
                        .string()
                        .describe(
                          "Series color. Always ask for color and if the user doesn't ask for color, use the default color."
                        ),
                    })
                  )
                  .optional(),
                backgroundColor: z
                  .string()
                  .optional()
                  .default("#52525c")
                  .describe("Background color of the chart"),
                textColor: z
                  .string()
                  .optional()
                  .default("#fff")
                  .describe("Text color of the chart"),
              }),
              prompt: `Generate ECharts-compatible option config for a bar chart based on schema and this description:\n\nTitle: ${
                title ?? ""
              }\nSeries data: ${JSON.stringify(
                seriesData ?? [],
                null,
                2
              )}\nBackground color: ${backgroundColor ?? ""}\nText color: ${
                textColor ?? ""
              }`,
            });
            return {
              chartData: object,
            };
          } catch (error) {
            console.log("error", error);
            return error;
          }
        },
      }),

      getCryptoPrice: tool({
        description: `Use this tool to get the current price of a cryptocurrency.
        
        ✅ Required for:
        - Cryptocurrency price information
        
        🧠 Behavior:
        - Always ask for the cryptocurrency name.
        - Always confirm the information provided by the user before getting the price.
        - Always suggest the closest supported alternative if the cryptocurrency is unclear.
        The goal is to help the user get the current price of a cryptocurrency.
        `,
        parameters: z.object({
          currency: z
            .string()
            .describe("The cryptocurrency symbol, e.g., BTC, ETH"),
        }),

        execute: async ({ currency }) => {
          try {
            const sym = `THB_${currency.toUpperCase()}`;
            const res = await fetch(
              `https://api.bitkub.com/api/market/ticker?sym=${sym}`
            );
            const json = await res.json();

            if (!json[sym]) {
              return {
                error: `Unable to find price for ${currency}. Please check the symbol.`,
              };
            }

            return {
              name: currency.toUpperCase(),
              price: json[sym].last,
              timestamp: new Date().toISOString(),
              allData: json,
            };
          } catch (error) {
            console.log("error", error);
            return {
              error: `Failed to fetch price for ${currency}.`,
            };
          }
        },
      }),
    },

    async onFinish({ response }) {
      const finalMessages = appendResponseMessages({
        messages,
        responseMessages: response.messages,
      });

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Error fetching user:", authError);
        return;
      }

      if (!user) {
        console.error("User not found");
        return;
      }

      await supabase
        .from("chats")
        .upsert({
          id: chatId,
          messages: finalMessages,
          user_id: user.id,
        })
        .eq("id", chatId);
    },
  });

  return result.toDataStreamResponse();
}
