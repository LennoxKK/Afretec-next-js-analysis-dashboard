import { getGroupedResponsesJSON } from '@/lib/database'; // or wherever it's defined

export default async function handler(req, res) {
  try {
    const data = await getGroupedResponsesJSON();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching grouped disease responses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
