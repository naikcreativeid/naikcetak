export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { to, subject, template, payload } = req.body ?? {};

    return res.status(200).json({
      success: true,
      queued: true,
      to,
      subject,
      template,
      payload,
      message: 'Email handler stub siap dihubungkan ke SMTP/backend aktif.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
