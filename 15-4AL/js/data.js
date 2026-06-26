// Database of tourist spots and dining options in Gia Lai
const GIA_LAI_DATA = {
  spots: [
    {
      id: "bien-ho",
      name: "Biển Hồ (Hồ T'Nưng)",
      category: ["nature", "check-in", "relaxation"],
      tags: ["Thiên nhiên", "Check-in", "Nghỉ dưỡng"],
      coordinates: [14.050478, 108.016335],
      rating: 4.8,
      reviewsCount: 1240,
      price: 10000,
      openingHours: "07:00 - 18:00",
      description: "Hồ nước ngọt tự nhiên nằm trên miệng núi lửa đã tắt từ hàng triệu năm trước. Nơi đây được mệnh danh là 'Đôi mắt Pleiku' với làn nước trong xanh phẳng lặng quanh năm và những hàng thông cổ thụ xanh rì vi vu trong gió.",
      image: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80",
      greenScore: 95,
      isGreen: true,
      tip: "Nên ghé thăm vào sáng sớm khi sương mù còn lảng bảng trên mặt hồ hoặc lúc hoàng hôn buông xuống."
    },
    {
      id: "chua-minh-thanh",
      name: "Chùa Minh Thành",
      category: ["culture", "check-in"],
      tags: ["Văn hóa", "Check-in"],
      coordinates: [13.967812, 107.994782],
      rating: 4.7,
      reviewsCount: 950,
      price: 0,
      openingHours: "07:00 - 18:30",
      description: "Ngôi chùa cổ kính mang kiến trúc độc đáo, pha trộn hài hòa giữa phong cách đền chùa Nhật Bản, Đài Loan và kiến trúc nhà rông Tây Nguyên độc đáo. Điểm nhấn là tòa bảo tháp xá lợi 9 tầng cao 72m uy nghiêm giữa lòng thành phố.",
      image: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&w=800&q=80",
      greenScore: 70,
      isGreen: false,
      tip: "Hãy mặc trang phục lịch sự, tôn nghiêm khi tham quan chiêm bái."
    },
    {
      id: "chu-dang-ya",
      name: "Núi Lửa Chư Đăng Ya",
      category: ["nature", "trekking", "check-in"],
      tags: ["Thiên nhiên", "Trekking", "Check-in"],
      coordinates: [14.129202, 108.031024],
      rating: 4.9,
      reviewsCount: 880,
      price: 0,
      openingHours: "Tự do",
      description: "Ngọn núi lửa đã ngưng hoạt động hàng triệu năm, có lòng chảo khổng lồ phì nhiêu được người dân trồng trọt ngô, khoai, dong riềng. Nơi đây nổi tiếng rực rỡ sắc vàng của hoa dã quỳ mỗi dịp cuối năm từ tháng 11.",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
      greenScore: 98,
      isGreen: true,
      tip: "Leo bộ lên đỉnh lòng chảo mất khoảng 20 phút, hãy mang giày thể thao bám đường tốt."
    },
    {
      id: "lang-op",
      name: "Làng Văn Hóa Jrai (Làng Ốp)",
      category: ["culture", "cuisine"],
      tags: ["Văn hóa", "Ẩm thực"],
      coordinates: [13.985612, 108.026415],
      rating: 4.6,
      reviewsCount: 420,
      price: 0,
      openingHours: "08:00 - 21:00",
      description: "Ngôi làng du lịch cộng đồng của đồng bào Jrai ngay sát Pleiku. Du khách được chiêm ngưỡng nhà rông cao vút, hệ thống nhà sàn truyền thống, khu nhà mồ với tượng gỗ dân gian độc đáo, thưởng thức cồng chiêng và rượu cần.",
      image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
      greenScore: 90,
      isGreen: true,
      tip: "Nên đặt trước bữa ăn tối giao lưu văn nghệ cồng chiêng và thịt nướng rượu cần cùng dân bản địa."
    },
    {
      id: "thac-phu-cuong",
      name: "Thác Phú Cường",
      category: ["nature", "trekking"],
      tags: ["Thiên nhiên", "Trekking"],
      coordinates: [13.782012, 108.156412],
      rating: 4.8,
      reviewsCount: 610,
      price: 20000,
      openingHours: "07:30 - 17:00",
      description: "Dòng thác kỳ vĩ chảy xiết đổ thẳng từ độ cao 45m xuống lòng suối đá núi lửa cổ xưa. Khung cảnh xung quanh hoang sơ với vách đá dựng đứng, hơi nước tung bọt trắng xóa mờ ảo tạo nên chiếc cầu vồng tự nhiên tuyệt đẹp.",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
      greenScore: 96,
      isGreen: true,
      tip: "Hành trình đi xuống chân thác có bậc thang dốc đứng, hãy di chuyển cẩn thận vì hơi ẩm bám đá trơn trượt."
    },
    {
      id: "hang-thong-tram-tuoi",
      name: "Hàng Thông Trăm Tuổi",
      category: ["check-in", "nature", "relaxation"],
      tags: ["Check-in", "Thiên nhiên", "Nghỉ dưỡng"],
      coordinates: [14.072554, 107.998462],
      rating: 4.7,
      reviewsCount: 1100,
      price: 0,
      openingHours: "Tự do",
      description: "Con đường đất đỏ chạy thẳng tắp xuyên qua hai hàng thông cổ thụ được trồng từ thời Pháp thuộc hơn 100 năm tuổi, vươn cao tỏa bóng mát rượi. Được mệnh danh là 'con đường Hàn Quốc' lãng mạn bậc nhất Gia Lai.",
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
      greenScore: 90,
      isGreen: true,
      tip: "Địa điểm lý tưởng để đạp xe dạo bộ lúc sáng sớm đón những tia nắng đầu ngày xuyên qua tán lá thông mù sương."
    },
    {
      id: "buu-minh",
      name: "Chùa Bửu Minh",
      category: ["culture", "check-in"],
      tags: ["Văn hóa", "Check-in"],
      coordinates: [14.084124, 107.991204],
      rating: 4.6,
      reviewsCount: 390,
      price: 0,
      openingHours: "06:00 - 18:00",
      description: "Nằm trang nghiêm cuối con đường hàng thông trăm tuổi, giữa những đồi chè cổ thụ xanh mướt quanh năm. Ngôi chùa sở hữu kiến trúc giao thoa văn hóa Á Đông thanh thoát, tĩnh mịch cùng đỉnh tháp nhọn vút cao lên bầu trời xanh.",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&q=80",
      greenScore: 88,
      isGreen: true,
      tip: "Ngắm chùa từ đồi chè bên cạnh sẽ thấy được trọn vẹn cảnh tháp chùa vươn lên giữa nông trại trà xanh ngút ngàn."
    },
    {
      id: "dai-doan-ket",
      name: "Quảng Trường Đại Đoàn Kết",
      category: ["check-in", "culture", "family"],
      tags: ["Check-in", "Văn hóa", "Gia đình"],
      coordinates: [13.980645, 108.006212],
      rating: 4.7,
      reviewsCount: 1540,
      price: 0,
      openingHours: "Tự do",
      description: "Trái tim xanh của Pleiku với khuôn viên rộng 12 hecta bao gồm tượng đài Bác Hồ bằng đồng lớn nhất Việt Nam, bức phù điêu chạm khắc tinh xảo lịch sử Tây Nguyên, dàn 54 cột đá tượng trưng 54 dân tộc và dàn cồng chiêng độc đáo.",
      image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
      greenScore: 80,
      isGreen: false,
      tip: "Nên ghé thăm vào buổi tối khi quảng trường lên đèn lung linh, người dân địa phương tập trung thả diều và tản bộ."
    },
    {
      id: "cho-dem-pleiku",
      name: "Chợ Đêm Pleiku (Phố Đêm)",
      category: ["cuisine", "culture"],
      tags: ["Ẩm thực", "Văn hóa"],
      coordinates: [13.978412, 108.002145],
      rating: 4.6,
      reviewsCount: 2100,
      price: 0,
      openingHours: "18:00 - 02:00 sáng",
      description: "Khu chợ đêm sầm uất nhộn nhịp nhất Pleiku, được biết đến là thiên đường ẩm thực đường phố. Đây là nơi bạn dễ dàng thưởng thức các món ăn đặc sản nóng hổi như phở khô hai tô, thịt lụi nướng, bún mắm nêm, chè nóng và uống sữa đậu nành.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
      greenScore: 60,
      isGreen: false,
      tip: "Đến tầm 19:30 - 21:30 là lúc chợ đông vui nhất. Nhớ thử món phở khô Pleiku chuẩn vị tại các quầy hàng trong chợ."
    },
    {
      id: "nui-ham-rong",
      name: "Núi Hàm Rồng (Chư Hơ Nông)",
      category: ["nature", "trekking", "green"],
      tags: ["Thiên nhiên", "Trekking", "Du lịch xanh"],
      coordinates: [13.892451, 107.992145],
      rating: 4.5,
      reviewsCount: 310,
      price: 0,
      openingHours: "Tự do",
      description: "Được mệnh danh là nóc nhà của Pleiku với độ cao hơn 1.000m. Ngọn núi lửa đã tắt có hình dạng như một chiếc phễu khổng lồ từ trên cao nhìn xuống, quanh năm phủ kín những cánh rừng thông xanh mướt mát mẻ và sương mù bao phủ.",
      image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80",
      greenScore: 97,
      isGreen: true,
      tip: "Có đường nhựa uốn lượn lên tới gần đỉnh đài radar, dọc đường đi ngập sắc hoa dã quỳ nở rộ vào dịp cuối năm rất đẹp."
    },
    {
      id: "thuy-dien-yaly",
      name: "Công Trình Thủy Điện Yaly",
      category: ["culture", "check-in", "family"],
      tags: ["Văn hóa", "Check-in", "Gia đình"],
      coordinates: [14.221415, 107.821412],
      rating: 4.4,
      reviewsCount: 520,
      price: 30000,
      openingHours: "07:30 - 17:00",
      description: "Nhà máy thủy điện ngầm lớn thứ hai Việt Nam nằm sâu trong lòng núi đá trên dòng sông Sê San. Đến đây du khách được tham quan đập tràn xả lũ khổng lồ, hồ chứa nước mênh mông và cung đường hầm chạy sâu hàng trăm mét dưới lòng đất.",
      image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      greenScore: 75,
      isGreen: false,
      tip: "Khoảng cách từ Pleiku khoảng 40km, nên kết hợp đi chung lịch trình tham quan Biển Hồ và đồi chè Bửu Minh trong ngày."
    },
    {
      id: "ca-phe-thu-ha",
      name: "Cà Phê Thu Hà (Pleiku)",
      category: ["cuisine", "coffee", "relaxation"],
      tags: ["Ẩm thực", "Cà phê", "Nghỉ dưỡng"],
      coordinates: [13.977412, 108.004124],
      rating: 4.6,
      reviewsCount: 780,
      price: 25000,
      openingHours: "06:00 - 22:00",
      description: "Thương hiệu cà phê lâu đời nhất nhì Pleiku từ năm 1970. Nằm ngay khu vực trung tâm, quán giữ phong cách pha phin truyền thống mộc mạc đậm vị bazan đất đỏ, là địa điểm không thể bỏ qua đối với tín đồ mê hương vị cà phê Tây Nguyên gốc.",
      image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=800&q=80",
      greenScore: 80,
      isGreen: false,
      tip: "Hãy thử ly Cà phê phin sữa đá đậm đặc đặc trưng để cảm nhận vị đắng đằm thắm rồi ngọt hậu sâu lắng."
    },
    {
      id: "quan-pho-hong",
      name: "Phở Khô Hồng (Phở Hai Tô)",
      category: ["cuisine"],
      tags: ["Ẩm thực"],
      coordinates: [13.975412, 108.005124],
      rating: 4.8,
      reviewsCount: 1650,
      price: 45000,
      openingHours: "06:30 - 22:00",
      description: "Thương hiệu phở khô gia truyền nổi tiếng nhất Gia Lai. Món ăn độc đáo gồm một tô phở trộn khô với thịt băm, hành phi, tóp mỡ giòn rụm ăn kèm đĩa rau sống xanh mát, và một tô nước dùng bò hầm ngọt thanh thơm lừng xương ống.",
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80",
      greenScore: 75,
      isGreen: false,
      tip: "Nhớ nêm tương đen đặc trưng được nấu thủ công từ đậu nành lên bánh phở, trộn đều cùng chanh ớt trước khi thưởng thức."
    },
    {
      id: "ga-nuong-ploi-ksor",
      name: "Ẩm Thực Tây Nguyên Plơi Ksor (Gà Nướng Cơm Lam)",
      category: ["cuisine", "culture"],
      tags: ["Ẩm thực", "Văn hóa"],
      coordinates: [14.004124, 108.012145],
      rating: 4.7,
      reviewsCount: 540,
      price: 150000,
      openingHours: "10:00 - 21:00",
      description: "Nhà hàng vườn sinh thái chuyên phục vụ ẩm thực Jrai truyền thống. Nổi tiếng nhất là món Gà nướng sa lửa nguyên con vàng ươm, da giòn ruộm chấm muối lá é giã ớt rừng, ăn kèm những ống cơm lam nếp nương dẻo quánh nướng trong ống tre non.",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      greenScore: 85,
      isGreen: true,
      tip: "Nên thưởng thức kèm một ống rượu cần và ngắm nhìn hoàng hôn bên không gian vườn tranh mộc mạc."
    }
  ],

  // Mock weather conditions based on season/date
  weatherForecasts: [
    { name: "Nắng ráo", icon: "fa-sun", temp: "24-28°C", text: "Trời nắng xanh mát, lý tưởng để tham quan các điểm ngoài trời như núi lửa Chư Đăng Ya và Biển Hồ.", suit: "Kính râm, kem chống nắng, đồ mỏng nhẹ." },
    { name: "Mưa rào nhẹ", icon: "fa-cloud-rain", temp: "21-25°C", text: "Có mưa bóng mây rải rác buổi chiều. Bạn nên ưu tiên tham quan Chùa Minh Thành, các quán cafe phin ấm áp.", suit: "Mang theo ô/áo mưa tiện lợi, đi giày bám tốt." },
    { name: "Sương mù huyền ảo", icon: "fa-smog", temp: "18-22°C", text: "Thời tiết Pleiku se lạnh đầy sương mù lãng mạn. Rất đẹp khi chụp hình Hàng thông trăm tuổi lúc sáng sớm.", suit: "Mang theo áo khoác ấm, khăn quàng cổ nhẹ." }
  ],

  // Badges metadata for gamification
  badges: [
    { id: "nature-explorer", name: "Chinh Phục Đại Ngàn", desc: "Tạo lịch trình có sở thích 'Thiên nhiên' và ghé thăm Biển Hồ.", icon: "🌱", condition: "has_nature" },
    { id: "culture-hunter", name: "Tây Nguyên Bản Sắc", desc: "Tích hợp tham quan Làng Ốp và Chùa Minh Thành trong chuyến đi.", icon: "🏮", condition: "has_culture" },
    { id: "gourmet", name: "Thánh Ăn Pleiku", desc: "Được AI chatbot gợi ý ăn phở khô hai tô hoặc cơm lam gà nướng.", icon: "🍗", condition: "chat_food" },
    { id: "eco-traveler", name: "Đại Sứ Xanh", desc: "Đạt điểm du lịch bền vững (Green Score) trung bình từ 85% trở lên.", icon: "♻️", condition: "green_score" },
    { id: "budget-master", name: "Nhà Tiêu Dùng Thông Thái", desc: "Tùy chỉnh ngân sách chuyến đi và lưu lại lịch trình thành công.", icon: "💰", condition: "save_budget" }
  ],

  // Estimated distances and times helper
  getRouteDetails: function(spot1Id, spot2Id) {
    // Generate simulated realistic travel distance and times if not hardcoded
    const hash = (spot1Id + spot2Id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const distanceKm = parseFloat(((hash % 18) + 3).toFixed(1)); // 3km to 21km
    const timeMinutes = Math.round(distanceKm * 2.2); // ~2-3 mins per km
    return {
      distance: distanceKm + " km",
      duration: timeMinutes + " phút",
      distanceValue: distanceKm,
      durationValue: timeMinutes
    };
  }
};

// Global variables export/mapping if needed by other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GIA_LAI_DATA;
}
