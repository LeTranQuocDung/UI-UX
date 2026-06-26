// Gemini API client and Voice integration
const GEMINI_SYSTEM_INSTRUCTION = `
Bạn là "Smart Travel Gia Lai AI Co-pilot" - Trợ lý du lịch thông minh, thân thiện và nhiệt tình của tỉnh Gia Lai.
Nhiệm vụ của bạn là hỗ trợ du khách tư vấn địa điểm, ẩm thực, lịch trình và trả lời các câu hỏi về Gia Lai.

Danh sách địa điểm và ID tương ứng mà hệ thống hỗ trợ:
- "bien-ho": Biển Hồ (Hồ T'Nưng) - Thiên nhiên, Check-in, Nghỉ dưỡng
- "chua-minh-thanh": Chùa Minh Thành - Văn hóa, Check-in
- "chu-dang-ya": Núi Lửa Chư Đăng Ya - Thiên nhiên, Trekking, Check-in
- "lang-op": Làng Văn Hóa Jrai (Làng Ốp) - Văn hóa, Ẩm thực
- "thac-phu-cuong": Thác Phú Cường - Thiên nhiên, Trekking
- "hang-thong-tram-tuoi": Hàng Thông Trăm Tuổi - Check-in, Thiên nhiên, Nghỉ dưỡng
- "buu-minh": Chùa Bửu Minh - Văn hóa, Check-in
- "dai-doan-ket": Quảng Trường Đại Đoàn Kết - Check-in, Văn hóa, Gia đình
- "cho-dem-pleiku": Chợ Đêm Pleiku (Phố Đêm) - Ẩm thực, Văn hóa
- "nui-ham-rong": Núi Hàm Rồng - Thiên nhiên, Trekking, Du lịch xanh
- "thuy-dien-yaly": Công Trình Thủy Điện Yaly - Văn hóa, Check-in, Gia đình
- "ca-phe-thu-ha": Cà Phê Thu Hà - Ẩm thực, Cà phê
- "quan-pho-hong": Phở Khô Hồng (Phở Hai Tô) - Ẩm thực
- "ga-nuong-ploi-ksor": Gà Nướng Plơi Ksor (Cơm lam gà nướng) - Ẩm thực, Văn hóa

QUY TẮC CẬP NHẬT LỊCH TRÌNH:
Khi người dùng muốn thay đổi lịch trình (ví dụ: thêm một địa điểm, xóa bớt địa điểm trekking, đổi quán ăn, thay thế địa điểm, v.v.):
1. Trong câu trả lời, hãy giải thích rõ ràng bạn đã thay đổi gì (Ví dụ: "Tôi đã thay Núi lửa Chư Đăng Ya bằng Chùa Bửu Minh và vườn chè Biển Hồ cho bạn...").
2. BẮT BUỘC chèn thêm một khối JSON ở cuối câu trả lời của bạn theo định dạng chính xác sau đây (không được thừa dấu hay text bao quanh khối JSON này ngoại trừ dấu mở/đóng code block):
\`\`\`json
{
  "action": "update_itinerary",
  "spots": ["id-1", "id-2", "id-3", "id-4"]
}
\`\`\`
Trong đó "spots" là mảng chứa toàn bộ các ID địa điểm của lịch trình MỚI sau khi đã chỉnh sửa theo ý người dùng. Hãy sắp xếp thứ tự các ID này theo trình tự di chuyển hợp lý nhất có thể. Không bịa ra ID không nằm trong danh sách trên.

QUY TẮC NGÔN NGỮ:
Hỗ trợ song ngữ Tiếng Việt và Tiếng Anh. Nếu người dùng hỏi bằng tiếng nào, hãy trả lời bằng tiếng đó.
`;

const AI_AGENT = {
  apiKey: localStorage.getItem('gemini_api_key') || 'AQ.Ab8RN6LmCJwOWyZFwsI_0mKXJjePlQx7x0OvBvP28PgVnAPNOQ',
  chatHistory: [],

  // Save API key
  setApiKey: function(key) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
  },

  getApiKey: function() {
    return this.apiKey;
  },

  // Clear chat history
  clearHistory: function() {
    this.chatHistory = [];
  },

  // Send message to Gemini API
  sendMessage: async function(userMessage, currentSpots = []) {
    if (!this.apiKey) {
      throw new Error("Vui lòng cấu hình API Key của Gemini trong phần cài đặt trước khi trò chuyện!");
    }

    // Append user message to history
    this.chatHistory.push({ role: 'user', content: userMessage });

    // Build context prompt
    const spotsContext = currentSpots.map(s => `${s.name} (${s.id})`).join(', ');
    const systemPromptWithContext = GEMINI_SYSTEM_INSTRUCTION + `\nLịch trình hiện tại của người dùng gồm các địa điểm: [${spotsContext}].`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      
      const contents = this.chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const requestBody = {
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemPromptWithContext }]
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Không thể kết nối tới API Gemini.');
      }

      const data = await response.json();
      const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Save assistant response to history
      this.chatHistory.push({ role: 'assistant', content: aiResponseText });

      // Parse itinerary updates if any
      let parsedUpdate = null;
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = aiResponseText.match(jsonRegex);
      
      if (match && match[1]) {
        try {
          const json = JSON.parse(match[1].trim());
          if (json.action === 'update_itinerary' && Array.isArray(json.spots)) {
            parsedUpdate = json.spots;
          }
        } catch (e) {
          console.error("Lỗi parse JSON lịch trình từ AI:", e);
        }
      }

      // Remove the JSON block from display text so user doesn't see raw JSON
      const cleanText = aiResponseText.replace(jsonRegex, '').trim();

      return {
        text: cleanText,
        updatedSpots: parsedUpdate
      };

    } catch (error) {
      // Remove failed message from history to prevent corrupting next requests
      this.chatHistory.pop();
      throw error;
    }
  },

  // --- Voice Features (Speech Synthesis and Recognition) ---
  
  // Text to Speech
  speak: function(text, lang = 'vi-VN', onEndCallback = null) {
    if ('speechSynthesis' in window) {
      // Cancel previous speech
      window.speechSynthesis.cancel();
      
      // Strip markdown tags for cleaner speech
      const cleanText = text.replace(/[*#`_\-]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      
      // Try to find a Vietnamese or English voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(voice => voice.lang.includes(lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      if (onEndCallback) {
        utterance.onend = onEndCallback;
        utterance.onerror = onEndCallback;
      }

      window.speechSynthesis.speak(utterance);
      return utterance;
    } else {
      console.warn("Trình duyệt không hỗ trợ chuyển văn bản thành giọng nói (Text-to-Speech).");
      if (onEndCallback) onEndCallback();
      return null;
    }
  },

  stopSpeaking: function() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  // Speech to Text
  createSpeechRecognizer: function(onResultCallback, onErrorCallback, onStartCallback, onEndCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Trình duyệt không hỗ trợ nhận diện giọng nói (Speech-to-Text).");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN'; // Default to Vietnamese, can toggle to 'en-US' if needed

    recognition.onstart = () => {
      if (onStartCallback) onStartCallback();
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResultCallback) onResultCallback(transcript);
    };

    recognition.onerror = (event) => {
      if (onErrorCallback) onErrorCallback(event.error);
    };

    recognition.onend = () => {
      if (onEndCallback) onEndCallback();
    };

    return recognition;
  }
};

// Global export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AI_AGENT };
}
