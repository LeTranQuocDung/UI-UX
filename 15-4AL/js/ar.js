// Simulated AR Camera and Place Discovery Overlay
const AR_EXPLORER = {
  videoStream: null,
  videoElement: null,
  containerElement: null,
  isActive: false,
  yaw: 0, // Simulated horizontal viewing angle (-180 to 180 deg)
  landmarks: [
    { id: 'bien-ho', name: 'Biển Hồ', distance: '4.5 km', bearing: -30, elevation: 10, category: 'landscape' },
    { id: 'chua-minh-thanh', name: 'Chùa Minh Thành', distance: '1.2 km', bearing: 45, elevation: -5, category: 'temple' },
    { id: 'chu-dang-ya', name: 'Núi Lửa Chư Đăng Ya', distance: '15.4 km', bearing: -85, elevation: 25, category: 'mountain' },
    { id: 'hang-thong-tram-tuoi', name: 'Hàng Thông 100 Tuổi', distance: '5.8 km', bearing: -15, elevation: 5, category: 'nature' },
    { id: 'dai-doan-ket', name: 'Quảng Trường Đại Đoàn Kết', distance: '0.5 km', bearing: 110, elevation: -10, category: 'city' },
    { id: 'buu-minh', name: 'Chùa Bửu Minh', distance: '6.1 km', bearing: -20, elevation: 12, category: 'temple' }
  ],

  init: function(containerId, videoId) {
    this.containerElement = document.getElementById(containerId);
    this.videoElement = document.getElementById(videoId);
    this.setupInteractions();
  },

  // Start AR experience (request camera and start simulator loop)
  start: async function() {
    if (this.isActive) return;
    this.isActive = true;
    this.containerElement.classList.add('active');

    try {
      // Access camera
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobiles
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.videoStream;
        this.videoElement.play();
      }
    } catch (err) {
      console.warn("Không thể truy cập camera thực. Chuyển sang giả lập nền AR bằng video/hình ảnh động.", err);
      // Fallback: Add simulated camera styling class
      this.containerElement.classList.add('camera-fallback');
    }

    // Start drawing overlays
    this.renderLoop();
    this.setupDeviceSensors();
  },

  // Stop AR experience
  stop: function() {
    if (!this.isActive) return;
    this.isActive = false;
    this.containerElement.classList.remove('active');
    this.containerElement.classList.remove('camera-fallback');

    // Stop camera stream
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    // Clear orientation updates
    window.removeEventListener('deviceorientation', this.handleOrientation);
  },

  // Mouse/Touch dragging to rotate view (great for desktops)
  setupInteractions: function() {
    let isDragging = false;
    let startX = 0;

    const onStart = (e) => {
      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const dx = currentX - startX;
      
      // Update yaw based on drag distance
      this.yaw = (this.yaw - dx * 0.3) % 360;
      startX = currentX;
      this.updateLandmarkPositions();
      this.updateCompass();
    };

    const onEnd = () => {
      isDragging = false;
    };

    this.containerElement.addEventListener('mousedown', onStart);
    this.containerElement.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    this.containerElement.addEventListener('touchstart', onStart);
    this.containerElement.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  },

  // Mobile Device Orientation support
  setupDeviceSensors: function() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
    }
  },

  handleOrientation: function(event) {
    if (!this.isActive) return;
    // alpha is the compass direction in degrees (0 - 360)
    if (event.alpha !== null) {
      // Use alpha to set yaw
      this.yaw = -event.alpha;
      this.updateLandmarkPositions();
      this.updateCompass();
    }
  },

  // Update visual markers coordinates on screen based on Yaw angle
  updateLandmarkPositions: function() {
    const width = this.containerElement.clientWidth;
    const height = this.containerElement.clientHeight;
    
    // Field of View (FOV) of our camera view in degrees (approx 60 deg)
    const fov = 60;
    const fovHalf = fov / 2;

    this.landmarks.forEach(landmark => {
      // Calculate relative bearing to current yaw
      let relativeBearing = (landmark.bearing - this.yaw) % 360;
      
      // Normalize relative bearing to -180 to 180 range
      if (relativeBearing > 180) relativeBearing -= 360;
      if (relativeBearing < -180) relativeBearing += 360;

      // Check if landmark is inside our FOV
      const markerElement = document.getElementById(`ar-marker-${landmark.id}`);
      if (!markerElement) return;

      if (Math.abs(relativeBearing) < fovHalf) {
        // Visible on screen
        const percentX = 50 + (relativeBearing / fovHalf) * 50;
        // Map elevation to Y axis
        const percentY = 50 - (landmark.elevation); 

        markerElement.style.left = `${percentX}%`;
        markerElement.style.top = `${percentY}%`;
        markerElement.style.display = 'flex';
        markerElement.style.transform = `translate(-50%, -50%) scale(${1 - Math.abs(relativeBearing) / 100})`;
        markerElement.style.opacity = 1 - Math.abs(relativeBearing) / (fovHalf * 1.2);
      } else {
        // Offscreen
        markerElement.style.display = 'none';
      }
    });
  },

  // Compass tape updates at top of HUD
  updateCompass: function() {
    const compassTape = this.containerElement.querySelector('.ar-compass-tape');
    if (compassTape) {
      // Normalize yaw to 0-360
      let displayYaw = Math.round(this.yaw) % 360;
      if (displayYaw < 0) displayYaw += 360;
      
      // Translate compass tape background
      // 360 degrees mapped to some width
      const shiftX = -(displayYaw * 2); // 2px per degree
      compassTape.style.transform = `translateX(${shiftX}px)`;
      
      const compassText = this.containerElement.querySelector('.ar-compass-value');
      if (compassText) {
        const directions = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
        const index = Math.round(((displayYaw % 360) / 45)) % 8;
        compassText.innerHTML = `${displayYaw}° <span class="dir-text">${directions[index]}</span>`;
      }
    }
  },

  renderLoop: function() {
    if (!this.isActive) return;
    this.updateLandmarkPositions();
    this.updateCompass();
    requestAnimationFrame(this.renderLoop.bind(this));
  }
};

// Global export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AR_EXPLORER };
}
