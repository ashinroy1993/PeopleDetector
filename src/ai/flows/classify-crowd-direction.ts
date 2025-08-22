'use server';

/**
 * @fileOverview Classifies the dominant direction of movement in a camera feed.
 *
 * - classifyCrowdDirection - A function that classifies the crowd direction.
 * - ClassifyCrowdDirectionInput - The input type for the classifyCrowdDirection function.
 * - ClassifyCrowdDirectionOutput - The return type for the classifyCrowdDirection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyCrowdDirectionInputSchema = z.object({
  frameDataUri: z
    .string()
    .describe(
      "A frame from the camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  detectedPeopleCount: z
    .number()
    .describe('The number of people detected in the frame.'),
});
export type ClassifyCrowdDirectionInput = z.infer<typeof ClassifyCrowdDirectionInputSchema>;

const ClassifyCrowdDirectionOutputSchema = z.object({
  direction: z
    .enum(['left', 'front', 'right', 'everywhere'])
    .describe('The dominant direction of movement.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence score of the direction classification.'),
});
export type ClassifyCrowdDirectionOutput = z.infer<typeof ClassifyCrowdDirectionOutputSchema>;

export async function classifyCrowdDirection(
  input: ClassifyCrowdDirectionInput
): Promise<ClassifyCrowdDirectionOutput> {
  return classifyCrowdDirectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyCrowdDirectionPrompt',
  input: {schema: ClassifyCrowdDirectionInputSchema},
  output: {schema: ClassifyCrowdDirectionOutputSchema},
  prompt: `You are an expert in analyzing crowd movement from video frames. Given a frame from a camera feed and the number of people detected, you will classify the dominant direction of movement.

  The direction can be one of the following: left, front, right, or everywhere.

  Consider the overall movement trends of the detected people to determine the primary direction.

  Frame: {{media url=frameDataUri}}
  Number of People Detected: {{{detectedPeopleCount}}}

  Direction Classification:`,
});

const classifyCrowdDirectionFlow = ai.defineFlow(
  {
    name: 'classifyCrowdDirectionFlow',
    inputSchema: ClassifyCrowdDirectionInputSchema,
    outputSchema: ClassifyCrowdDirectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
