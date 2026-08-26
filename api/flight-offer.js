import { duffelConfigured, getOffer } from '../server/duffel.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!duffelConfigured()) {
    return res.status(200).json({ configured: false, provider: 'duffel' });
  }

  const id = String(req.query?.id || '').trim();
  if (!id || id.length > 120) return res.status(400).json({ error: 'Invalid offer id' });

  try {
    const offer = await getOffer(id);
    return res.status(200).json({ configured: true, provider: 'duffel', offer });
  } catch (error) {
    console.error('Duffel offer endpoint error', error?.payload || error);
    const status = Number(error?.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      configured: true,
      provider: 'duffel',
      error: 'Could not refresh this offer',
    });
  }
}
