import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function for Background Removal
 * 
 * This function uses the Replicate API for background removal.
 * You'll need to set up the following environment variables in Vercel:
 * - REPLICATE_API_TOKEN: Your Replicate API token
 * 
 * Alternative APIs you can use:
 * - Remove.bg API (https://www.remove.bg/api)
 * - Photoroom API (https://www.photoroom.com/api)
 * - Clipdrop API (https://clipdrop.co/apis)
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields: base64Data, mimeType' });
    }

    // Extract base64 content from data URL if present
    let base64Content = base64Data;
    if (base64Content.startsWith('data:')) {
      const base64Index = base64Content.indexOf('base64,');
      if (base64Index !== -1) {
        base64Content = base64Content.substring(base64Index + 7);
      }
    }

    // Option 1: Using Replicate API (recommended)
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    
    if (!REPLICATE_API_TOKEN) {
      return res.status(500).json({ 
        error: 'REPLICATE_API_TOKEN not configured. Please add it to your Vercel environment variables.',
        setup: 'Get your API token from https://replicate.com/account/api-tokens'
      });
    }

    // Start the prediction
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
        input: {
          image: `data:${mimeType};base64,${base64Content}`,
        },
      }),
    });

    if (!predictionResponse.ok) {
      const error = await predictionResponse.text();
      console.error('Replicate API error:', error);
      return res.status(500).json({ error: 'Failed to start background removal' });
    }

    const prediction = await predictionResponse.json();
    
    // Poll for completion
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(result.urls.get, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        },
      });
      result = await statusResponse.json();
    }

    if (result.status === 'failed') {
      return res.status(500).json({ error: 'Background removal failed' });
    }

    // The output is the URL of the processed image
    const processedUrl = result.output;

    // Optionally: Download and add white background using sharp
    // For simplicity, we return the transparent PNG URL directly
    // You can add sharp processing here if needed

    return res.status(200).json({ 
      processedUrl,
      status: 'completed'
    });

  } catch (error) {
    console.error('Background removal error:', error);
    return res.status(500).json({ error: 'Failed to remove background' });
  }
}
