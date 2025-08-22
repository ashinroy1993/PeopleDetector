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
      "A frame from the camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  detectedPeopleCount: z
    .number()
    .describe('The number of people detected in the frame.'),
});
export type ClassifyCrowdDirectionInput = z.infer<typeof ClassifyCrowdDirectionInputSchema>;

const ClassifyCrowdDirectionOutputSchema = z.object({
  direction: z
    .enum(['left', 'front', 'right', 'everywhere'])
    .describe('The position in frame where larger number of people are present'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence score of the maximum number of people in provided position.'),
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
  prompt: `You are an expert in analyzing crowd distribution in video frames. Your task is to identify where the largest group of people is located within the frame. The output should be one of 'left', 'front', 'right', or 'everywhere'.

  Base your analysis on the spatial position of the people in the image, not the direction they are facing. Determine which area of the frame (left, front/center, right) contains the most individuals. If people are spread out across the entire frame, classify it as 'everywhere'.

  Frame: {{media url=frameDataUri}}
  Number of People Detected: {{{detectedPeopleCount}}}

  Position Classification:`,
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
