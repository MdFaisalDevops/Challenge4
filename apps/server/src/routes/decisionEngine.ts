import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { getGeminiModel } from '../config/gemini';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { formatAnalysisPrompt, getSystemInstruction } from '../utils/promptTemplates';
import { geminiTools, executeToolCall } from '../utils/geminiTools';
import { AppError } from '../utils/errors';
import { DecisionEngineInput } from '@crowdmind/shared';

const router = Router();

const validateResult = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

/**
 * @openapi
 * /api/v1/decision-engine/analyze:
 *   post:
 *     summary: Synchronously analyze telemetry and run operational tool calls
 *     tags: [AI Decision Engine]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crowdDensity
 *               - weather
 *             properties:
 *               crowdDensity:
 *                 type: string
 *               weather:
 *                 type: object
 *                 required:
 *                   - temperatureCelsius
 *                   - condition
 *                   - humidityPercent
 *                 properties:
 *                   temperatureCelsius:
 *                     type: number
 *                   condition:
 *                     type: string
 *                   humidityPercent:
 *                     type: number
 *               parking:
 *                 type: array
 *                 items:
 *                   type: object
 *               queueLength:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Structured Decision Output JSON
 */
router.post(
  '/analyze',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead']),
  [
    body('crowdDensity').isString().notEmpty().trim(),
    body('weather').isObject(),
    body('weather.temperatureCelsius').isNumeric(),
    body('weather.condition').isString().notEmpty(),
    body('weather.humidityPercent').isNumeric(),
    body('parking').optional().isArray(),
    body('queueLength').optional().isArray(),
    body('temperature').optional().isFloat({ min: 0.0, max: 2.0 }),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new AppError('Gemini API is not configured on this server.', 500);
      }

      const input = req.body as DecisionEngineInput;
      const prompt = formatAnalysisPrompt(input);

      // Initialize chat model with tools and instruction configs
      const model = getGeminiModel();
      const temp = typeof req.body.temperature === 'number' ? req.body.temperature : 0.1;
      const chat = model.startChat({
        systemInstruction: getSystemInstruction(),
        tools: geminiTools,
        generationConfig: { 
          responseMimeType: 'application/json',
          temperature: temp
        },
      });

      console.log('[decision-engine]: Sending prompt analysis to Gemini...');
      let result = await chat.sendMessage(prompt);
      let functionCalls = result.response.functionCalls;

      // Executing Function Calling loop until Gemini completes triggers
      let loopCount = 0;
      const maxLoops = 5; // Safeguard loop boundaries

      while (functionCalls && functionCalls.length > 0 && loopCount < maxLoops) {
        console.log(`[decision-engine]: Gemini requested ${functionCalls.length} tool executions (Loop ${loopCount + 1})`);
        const toolResponses = [];

        for (const call of functionCalls) {
          const responseData = await executeToolCall(call.name, call.args);
          toolResponses.push({
            functionResponse: {
              name: call.name,
              response: responseData,
            },
          });
        }

        // Return tool outputs back to model to get next turn
        result = await chat.sendMessage(toolResponses);
        functionCalls = result.response.functionCalls;
        loopCount++;
      }

      const finalResponseText = result.response.text();
      let structuredJson = {};

      try {
        structuredJson = JSON.parse(finalResponseText);
      } catch (err) {
        console.error('[decision-engine]: Failed to parse Gemini response as JSON. Raw text:', finalResponseText);
        throw new AppError('AI model returned invalid JSON structure.', 502);
      }

      res.json({
        status: 'success',
        data: structuredJson,
        toolExecutionsCount: loopCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/decision-engine/analyze/stream:
 *   post:
 *     summary: Stream the analysis reasoning chunks to the client via Server-Sent Events (SSE)
 *     tags: [AI Decision Engine]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crowdDensity
 *               - weather
 *     responses:
 *       200:
 *         description: SSE Text Stream
 */
router.post(
  '/analyze/stream',
  requireAuth,
  requireRole(['OpsDirector', 'SecurityLead']),
  [
    body('crowdDensity').isString().notEmpty().trim(),
    body('weather').isObject(),
    body('weather.temperatureCelsius').isNumeric(),
    body('weather.condition').isString().notEmpty(),
    body('weather.humidityPercent').isNumeric(),
    body('parking').optional().isArray(),
    body('queueLength').optional().isArray(),
  ],
  validateResult,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new AppError('Gemini API is not configured on this server.', 500);
      }

      const input = req.body as DecisionEngineInput;
      const prompt = formatAnalysisPrompt(input);

      // Stream settings (Note: function calling cannot stream JSON outputs directly, 
      // so this endpoint streams raw reasoning/analytics directly for visual tracking)
      const model = getGeminiModel();
      const streamPromise = model.generateContentStream({
        contents: [prompt],
        systemInstruction: getSystemInstruction() + '\nOutput your analysis as raw text or structured JSON. Stream the contents.',
      });

      // Configure SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      console.log('[decision-engine]: Starting SSE stream response...');

      for await (const chunk of await streamPromise) {
        const textChunk = chunk.text();
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
