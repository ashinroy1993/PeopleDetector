// DetectPeople flow implementation
'use server';

/**
 * @fileOverview Detects and counts the number of people in an image.
 *
 * - detectPeople - A function that handles the person detection process.
 * - DetectPeopleInput - The input type for the detectPeople function.
 * - DetectPeopleOutput - The return type for the detectPeople function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPeopleInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectPeopleInput = z.infer<typeof DetectPeopleInputSchema>;

const DetectPeopleOutputSchema = z.object({
  personCount: z.number().describe('The number of people detected in the image.'),
});
export type DetectPeopleOutput = z.infer<typeof DetectPeopleOutputSchema>;

export async function detectPeople(input: DetectPeopleInput): Promise<DetectPeopleOutput> {
  return detectPeopleFlow(input);
}

const detectPeoplePrompt = ai.definePrompt({
  name: 'detectPeoplePrompt',
  input: {schema: DetectPeopleInputSchema},
  output: {schema: DetectPeopleOutputSchema},
  prompt: `You are an AI that analyzes images to detect the number of people present. Analyze the image provided and determine the number of people visible in the image. Return only a numerical count. 

Image: {{media url=photoDataUri}}`,
});

const detectPeopleFlow = ai.defineFlow(
  {
    name: 'detectPeopleFlow',
    inputSchema: DetectPeopleInputSchema,
    outputSchema: DetectPeopleOutputSchema,
  },
  async input => {
    const {output} = await detectPeoplePrompt(input);
    return output!;
  }
);
