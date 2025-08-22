'use server';

/**
 * @fileOverview Analyzes a camera frame to count people and classify their dominant direction.
 *
 * - classifyCrowdDirection - A function that handles the crowd analysis process.
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
});
export type ClassifyCrowdDirectionInput = z.infer<typeof ClassifyCrowdDirectionInputSchema>;

const ClassifyCrowdDirectionOutputSchema = z.object({
  personCount: z.number().describe('The number of people detected in the image.'),
  direction: z
    .enum(['left', 'center', 'right', 'everywhere'])
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
  prompt: `You are an expert in analyzing crowd distribution in video frames. Your task is to count the number of people and identify where the largest group is located.

  1.  Count the total number of people visible in the frame.
  2.  Mentally divide the frame vertically into three sections: 'left' (the leftmost 40%), 'center' (the middle 20%), and 'right' (the rightmost 40%).
  3.  Count the number of people whose center of mass falls into each of the three sections.
  4.  Determine which section contains the most people. This is the dominant position.
  5.  If people are distributed roughly evenly across all sections, or if you cannot confidently place the majority in one section, classify the direction as 'everywhere'.

  Base your analysis solely on the spatial position of people in the image, not the direction they are facing.

  Frame: {{media url=frameDataUri}}

  Analysis:`,
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
