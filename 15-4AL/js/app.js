// Main App Controller
const APP = {
  // State variables
  state: {
    activeScreen: 'screen-onboarding',
    preferences: new Set(),
    tripDetails: {
      destination: 'Gia Lai',
      startLoc: '',
      startDate: '',
      endDate: '',
      days: 3,
      guests: 2,
      budget: 'medium' // low, medium, high
    },
    itinerary: [], // Array of spot objects representing the current plan
    chatLog: [],
    unlockedBadges: new Set(JSON.parse(localStorage.getItem('unlocked_badges')) || []),
    activeItineraryDay: 1, // Currently viewed day in itinerary tab
    currentLang: 'vi', // vi, en
    activeExploreCategory: 'all'
  },

  map: null,
  mapMarkers: [],
  mapPolylines: null,
  speechRecognizer: null,
  isRecording: false,

  // UI elements cash
  screens: {},

  // Initialization
  init: function() {
    console.log("Initializing Smart Travel App...");
    
    // Register screens
    this.screens = {
      onboarding: document.getElementById('screen-onboarding'),
      preferences: document.getElementById('screen-preferences'),
      tripDetails: document.getElementById('screen-trip-details'),
      itinerary: document.getElementById('screen-itinerary'),
      chatbot: document.getElementById('screen-chatbot'),
      ar: document.getElementById('screen-ar')
    };

    // Load API Key from local storage to settings input
    const storedKey = AI_AGENT.getApiKey();
    const keyInput = document.getElementById('api-key-input');
    if (keyInput && storedKey) {
      keyInput.value = storedKey;
    }

    this.setupEventListeners();
    this.checkBadgesUI();
    
    // Set default dates in trip details screen (tomorrow and 3 days after)
    this.setDefaultDates();
  },

  setDefaultDates: function() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(tomorrow.getDate() + 2); // 3 days trip

    const startInput = document.getElementById('input-start-date');
    const endInput = document.getElementById('input-end-date');
    if (startInput && endInput) {
      startInput.value = tomorrow.toISOString().split('T')[0];
      endInput.value = dayAfter.toISOString().split('T')[0];
    }
  },

  // Screen navigation helper
  navigateTo: function(screenId) {
    console.log(`Navigating to screen: ${screenId}`);
    
    // Hide all screens by removing active class
    Object.values(this.screens).forEach(screen => {
      if (screen) {
        screen.classList.remove('active');
      }
    });

    // Show active screen by adding active class
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      // Force repaint
      targetScreen.offsetHeight;
      targetScreen.classList.add('active');
      this.state.activeScreen = screenId;
    }

    // Special layout triggers when switching screens
    if (screenId === 'screen-itinerary') {
      this.switchItineraryTab('timeline');
      // Re-initialize or invalidate size for Leaflet map to prevent gray tile bug
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
    
    // Stop camera if exiting AR screen
    if (screenId !== 'screen-ar') {
      AR_EXPLORER.stop();
    }
  },

  // Switch between itinerary pane tabs (Timeline / Explore / Map / Stats)
  switchItineraryTab: function(tabName) {
    console.log(`Switching itinerary tab to: ${tabName}`);
    
    // 1. Remove active class from all tabs
    const tabs = ['timeline', 'map', 'analytics', 'explore'];
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      if (btn) btn.classList.remove('active');
    });

    // 2. Add active class to selected tab
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 3. Update the active pane styling class on the parent container (for mobile/tablet layouts)
    const screen = document.getElementById('screen-itinerary');
    if (screen) {
      screen.classList.remove('active-pane-timeline', 'active-pane-map', 'active-pane-analytics', 'active-pane-explore');
      screen.classList.add(`active-pane-${tabName}`);
    }

    // 4. Handle display triggers for inner views within details column
    const timelineWrapper = document.getElementById('timeline-view-wrapper');
    const exploreWrapper = document.getElementById('explore-view-wrapper');
    
    if (tabName === 'timeline') {
      if (timelineWrapper) timelineWrapper.style.display = 'flex';
      if (exploreWrapper) exploreWrapper.style.display = 'none';
    } else if (tabName === 'explore') {
      if (timelineWrapper) timelineWrapper.style.display = 'none';
      if (exploreWrapper) exploreWrapper.style.display = 'flex';
      this.renderExplorePlaces(this.state.activeExploreCategory, document.getElementById('explore-search-input')?.value || '');
    }

    // 5. Invalidate Leaflet map size when map pane becomes visible on mobile to force complete render
    if (tabName === 'map' && this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 50);
    }
  },

  // Setup UI Interactions
  setupEventListeners: function() {
    // 1. Navigation Buttons
    document.getElementById('btn-start')?.addEventListener('click', () => this.navigateTo('screen-preferences'));
    document.getElementById('btn-back-to-onboarding')?.addEventListener('click', () => this.navigateTo('screen-onboarding'));
    document.getElementById('btn-back-to-preferences')?.addEventListener('click', () => this.navigateTo('screen-preferences'));
    document.getElementById('btn-back-to-details')?.addEventListener('click', () => this.navigateTo('screen-trip-details'));
    document.getElementById('btn-nav-chat')?.addEventListener('click', () => this.navigateTo('screen-chatbot'));
    document.getElementById('btn-nav-itinerary')?.addEventListener('click', () => this.navigateTo('screen-itinerary'));
    document.getElementById('btn-nav-ar')?.addEventListener('click', () => this.navigateTo('screen-ar'));

    // Logo click goes back to Home portal
    document.querySelector('.logo-container')?.addEventListener('click', () => {
      this.navigateTo('screen-onboarding');
    });

    // Home Chat triggers
    document.getElementById('btn-home-chat')?.addEventListener('click', () => this.navigateTo('screen-chatbot'));
    document.getElementById('floating-chat-bubble')?.addEventListener('click', () => this.navigateTo('screen-chatbot'));

    // 2. Preferences Survey Screen
    const prefChips = document.querySelectorAll('.pref-chip');
    prefChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const prefId = chip.dataset.pref;
        if (this.state.preferences.has(prefId)) {
          this.state.preferences.delete(prefId);
          chip.classList.remove('selected');
        } else {
          this.state.preferences.add(prefId);
          chip.classList.add('selected');
        }

        // Enable/Disable continue button
        const btnNext = document.getElementById('btn-preferences-next');
        if (btnNext) {
          btnNext.disabled = this.state.preferences.size === 0;
        }
      });
    });

    document.getElementById('btn-preferences-next')?.addEventListener('click', () => {
      this.navigateTo('screen-trip-details');
    });

    // 3. Trip Details Form Submit
    document.getElementById('btn-generate-itinerary')?.addEventListener('click', () => {
      this.processItineraryGeneration();
    });

    // Plus/Minus guest count
    document.getElementById('btn-guest-minus')?.addEventListener('click', () => {
      const input = document.getElementById('input-guests');
      let val = parseInt(input.value) || 1;
      if (val > 1) {
        input.value = val - 1;
        this.state.tripDetails.guests = val - 1;
      }
    });
    document.getElementById('btn-guest-plus')?.addEventListener('click', () => {
      const input = document.getElementById('input-guests');
      let val = parseInt(input.value) || 1;
      input.value = val + 1;
      this.state.tripDetails.guests = val + 1;
    });

    // Budget slider / selector
    const budgetOptions = document.querySelectorAll('.budget-btn');
    budgetOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        budgetOptions.forEach(b => b.classList.remove('selected'));
        opt.classList.add('selected');
        this.state.tripDetails.budget = opt.dataset.budget;
      });
    });

    // 4. Itinerary Day Tabs
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('day-tab-btn')) {
        const day = parseInt(e.target.dataset.day);
        this.switchItineraryDay(day);
      }
    });

    // Itinerary Main Navigation Tabs
    document.getElementById('tab-btn-timeline')?.addEventListener('click', () => this.switchItineraryTab('timeline'));
    document.getElementById('tab-btn-explore')?.addEventListener('click', () => this.switchItineraryTab('explore'));
    document.getElementById('tab-btn-map')?.addEventListener('click', () => this.switchItineraryTab('map'));
    document.getElementById('tab-btn-analytics')?.addEventListener('click', () => this.switchItineraryTab('analytics'));

    // Explore Search Input listener
    document.getElementById('explore-search-input')?.addEventListener('input', (e) => {
      this.renderExplorePlaces(this.state.activeExploreCategory, e.target.value);
    });

    // Explore Category Chips click listeners
    document.querySelectorAll('.explore-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.explore-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.activeExploreCategory = btn.dataset.cat;
        this.renderExplorePlaces(btn.dataset.cat, document.getElementById('explore-search-input')?.value || '');
      });
    });

    // 5. Chatbot Send Message and Voice
    document.getElementById('btn-chat-send')?.addEventListener('click', () => this.handleChatInput());
    document.getElementById('chat-text-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleChatInput();
    });

    // Chat micro suggestions
    const chatSuggestions = document.querySelectorAll('.suggestion-chip');
    chatSuggestions.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.query;
        document.getElementById('chat-text-input').value = text;
        this.handleChatInput();
      });
    });

    // Voice Input Mic Button
    const btnMic = document.getElementById('btn-chat-mic');
    if (btnMic) {
      btnMic.addEventListener('click', () => this.toggleVoiceRecording());
    }

    // Settings Modal
    document.getElementById('btn-settings-open')?.addEventListener('click', () => {
      document.getElementById('settings-modal').classList.add('active');
    });
    document.getElementById('btn-settings-close')?.addEventListener('click', () => {
      document.getElementById('settings-modal').classList.remove('active');
    });
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      const keyVal = document.getElementById('api-key-input').value.trim();
      AI_AGENT.setApiKey(keyVal);
      document.getElementById('settings-modal').classList.remove('active');
      this.showToast('Đã lưu cấu hình API Key!');
      this.checkAndAwardBadge('budget-master'); // Trigger badge
    });

    // Badge Modal Toggle
    document.getElementById('btn-badges-open')?.addEventListener('click', () => {
      this.checkBadgesUI();
      document.getElementById('badges-modal').classList.add('active');
    });
    document.getElementById('btn-badges-close')?.addEventListener('click', () => {
      document.getElementById('badges-modal').classList.remove('active');
    });

    // Detail Modal Close
    document.getElementById('btn-detail-close')?.addEventListener('click', () => {
      document.getElementById('spot-detail-modal').classList.remove('active');
    });

    // AR Mode Screen handlers
    document.getElementById('btn-ar-back')?.addEventListener('click', () => {
      this.navigateTo('screen-itinerary');
    });
    
    // Share Modal Toggle
    document.getElementById('btn-share-itinerary')?.addEventListener('click', () => {
      this.generateShareCard();
      document.getElementById('share-modal').classList.add('active');
    });
    document.getElementById('btn-share-close')?.addEventListener('click', () => {
      document.getElementById('share-modal').classList.remove('active');
    });
    document.getElementById('btn-download-card')?.addEventListener('click', () => {
      this.downloadShareCard();
    });

    // Language Toggle
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        this.toggleLanguage();
      });
    }

    // Quick action: Ask detail inside itinerary timeline
    document.addEventListener('click', (e) => {
      const viewDetailBtn = e.target.closest('.btn-spot-detail');
      if (viewDetailBtn) {
        const spotId = viewDetailBtn.dataset.spotId;
        this.showSpotDetails(spotId);
      }

      const askChatBtn = e.target.closest('.btn-spot-ask');
      if (askChatBtn) {
        const spotName = askChatBtn.dataset.spotName;
        this.navigateTo('screen-chatbot');
        document.getElementById('chat-text-input').value = `Hãy giới thiệu chi tiết cho tôi về ${spotName}`;
        this.handleChatInput();
      }
    });

    // Init AR elements
    AR_EXPLORER.init('ar-overlay-container', 'ar-video-feed');
    // Setup AR Landmark click listeners
    document.querySelectorAll('.ar-marker').forEach(marker => {
      marker.addEventListener('click', () => {
        const spotId = marker.dataset.spotId;
        this.showSpotDetails(spotId);
      });
    });
  },

  // Language translation toggle
  toggleLanguage: function() {
    this.state.currentLang = this.state.currentLang === 'vi' ? 'en' : 'vi';
    const btn = document.getElementById('btn-lang-toggle');
    if (btn) {
      btn.innerText = this.state.currentLang === 'vi' ? 'VI | EN' : 'EN | VI';
    }
    
    // Apply text translation
    const elementsToTranslate = document.querySelectorAll('[data-vi]');
    elementsToTranslate.forEach(el => {
      const viText = el.getAttribute('data-vi');
      const enText = el.getAttribute('data-en');
      if (this.state.currentLang === 'vi') {
        el.innerText = viText;
      } else {
        el.innerText = enText;
      }
    });

    this.showToast(this.state.currentLang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English');
  },

  // Toast notifier
  showToast: function(msg, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-bubble';
    toast.innerText = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Simulated Itinerary Generation flow
  processItineraryGeneration: function() {
    // 1. Gather trip details from form inputs
    const startLoc = document.getElementById('input-start-loc').value.trim() || 'Hồ Chí Minh';
    const startDateVal = document.getElementById('input-start-date').value;
    const endDateVal = document.getElementById('input-end-date').value;
    const guestsCount = parseInt(document.getElementById('input-guests').value) || 2;

    if (!startDateVal || !endDateVal) {
      this.showToast('Vui lòng chọn ngày đi và ngày về!');
      return;
    }

    const start = new Date(startDateVal);
    const end = new Date(endDateVal);
    const timeDiff = end.getTime() - start.getTime();
    const daysCount = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    if (daysCount <= 0) {
      this.showToast('Ngày về phải sau ngày đi!');
      return;
    }

    this.state.tripDetails = {
      destination: 'Gia Lai',
      startLoc: startLoc,
      startDate: startDateVal,
      endDate: endDateVal,
      days: daysCount,
      guests: guestsCount,
      budget: this.state.tripDetails.budget
    };

    // 2. Play beautiful scanning overlays
    const loader = document.getElementById('ai-generation-loader');
    const steps = loader.querySelectorAll('.loader-step');
    loader.classList.add('active');

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep > 0) {
        steps[currentStep - 1].classList.remove('active');
        steps[currentStep - 1].classList.add('done');
      }
      if (currentStep < steps.length) {
        steps[currentStep].classList.add('active');
        currentStep++;
      } else {
        clearInterval(interval);
        // Complete generation, build final itinerary
        this.generateItineraryFromPreferences();
        
        // Hide loader & direct to screen
        setTimeout(() => {
          loader.classList.remove('active');
          steps.forEach(s => {
            s.classList.remove('active', 'done');
          });
          this.navigateTo('screen-itinerary');
          this.showToast('Đã khởi tạo lịch trình AI tối ưu!');
          
          // Badge check: nature preference
          if (this.state.preferences.has('nature')) {
            this.checkAndAwardBadge('nature-explorer');
          }
          if (this.state.preferences.has('culture')) {
            this.checkAndAwardBadge('culture-hunter');
          }
        }, 600);
      }
    }, 800);
  },

  // Core Algorithmic Recommender (Satisfies requirement 2 - "Đề xuất lịch trình tự động")
  generateItineraryFromPreferences: function() {
    const prefList = Array.from(this.state.preferences);
    const availableSpots = [...GIA_LAI_DATA.spots];
    
    // Score spots based on preference matches with a small random variation to ensure diversity
    availableSpots.forEach(spot => {
      const matches = spot.category.filter(c => prefList.includes(c)).length;
      
      // Base score is preference matches * 10. Add random value [0, 4.9] for variation.
      let score = (matches * 10) + (Math.random() * 5);
      
      // Align scoring with budget constraints
      if (this.state.tripDetails.budget === 'low') {
        if (spot.price > 100000) score -= 15;
        else if (spot.price === 0) score += 3;
      } else if (this.state.tripDetails.budget === 'high') {
        if (spot.price > 50000) score += 3;
      }
      
      spot._tempScore = score;
    });

    // Sort spots by score descending
    availableSpots.sort((a, b) => b._tempScore - a._tempScore);

    const chosenItinerary = [];
    const spotsCountNeeded = this.state.tripDetails.days * 3;
    
    // Fill itinerary with highest matching spots
    for (let i = 0; i < Math.min(spotsCountNeeded, availableSpots.length); i++) {
      chosenItinerary.push(availableSpots[i]);
    }

    this.state.itinerary = chosenItinerary;
    this.state.activeItineraryDay = 1;
    this.renderItineraryTimeline();
    
    // Check Green Score
    const totalGreen = this.state.itinerary.reduce((sum, spot) => sum + spot.greenScore, 0);
    const avgGreen = Math.round(totalGreen / this.state.itinerary.length) || 50;
    if (avgGreen >= 85) {
      this.checkAndAwardBadge('eco-traveler');
    }
  },

  // Swapping specific spots inside itinerary
  swapSpotInItinerary: function(oldSpotId) {
    const available = GIA_LAI_DATA.spots.filter(s => !this.state.itinerary.some(i => i.id === s.id));
    if (available.length === 0) {
      this.showToast("Không còn địa điểm nào khác trong cơ sở dữ liệu để hoán đổi!");
      return;
    }

    // Pick a random available spot from the list to avoid fixed repetitions
    const randomIndex = Math.floor(Math.random() * available.length);
    const newSpot = available[randomIndex];
    const index = this.state.itinerary.findIndex(s => s.id === oldSpotId);
    if (index !== -1) {
      this.state.itinerary[index] = newSpot;
      this.renderItineraryTimeline();
      this.initMap();
      this.showToast(`Đã đổi thành ${newSpot.name}!`);
    }
  },

  // Delete specific spot
  deleteSpotFromItinerary: function(spotId) {
    if (this.state.itinerary.length <= 1) {
      this.showToast("Lịch trình phải giữ lại ít nhất 1 địa điểm!");
      return;
    }
    
    const spot = this.state.itinerary.find(s => s.id === spotId);
    this.state.itinerary = this.state.itinerary.filter(s => s.id !== spotId);
    this.renderItineraryTimeline();
    this.initMap();
    if (spot) {
      this.showToast(`Đã xóa ${spot.name} khỏi lịch trình.`);
    }
  },

  // Rearrange spots inside the itinerary array (Move Up / Down)
  moveSpotInItinerary: function(spotId, direction) {
    const index = this.state.itinerary.findIndex(s => s.id === spotId);
    if (index === -1) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.state.itinerary.length) return;

    // Swap positions
    const temp = this.state.itinerary[index];
    this.state.itinerary[index] = this.state.itinerary[targetIndex];
    this.state.itinerary[targetIndex] = temp;

    this.renderItineraryTimeline();
    this.initMap();
    this.showToast("Đã cập nhật thứ tự lộ trình!");
  },

  // Render Itinerary Visual Elements (timeline details, stats)
  renderItineraryTimeline: function() {
    const container = document.getElementById('itinerary-days-container');
    const timelineContainer = document.getElementById('timeline-list');
    
    if (!container || !timelineContainer) return;

    container.innerHTML = '';
    timelineContainer.innerHTML = '';

    const days = this.state.tripDetails.days;
    const spotsPerDay = 3; // morning, afternoon, night

    // 1. Create Day Tab Buttons
    for (let d = 1; d <= days; d++) {
      const btn = document.createElement('button');
      btn.className = `day-tab-btn ${this.state.activeItineraryDay === d ? 'active' : ''}`;
      btn.dataset.day = d;
      btn.innerHTML = `<span class="day-num">Ngày ${d}</span>`;
      container.appendChild(btn);
    }

    // 2. Filter spots for active day
    const dayStartIndex = (this.state.activeItineraryDay - 1) * spotsPerDay;
    const daySpots = this.state.itinerary.slice(dayStartIndex, dayStartIndex + spotsPerDay);

    // 3. Render Timeline items
    if (daySpots.length === 0) {
      timelineContainer.innerHTML = '<div class="empty-state-card">Không có địa điểm nào trong ngày này. Trò chuyện với AI để thêm địa điểm!</div>';
    } else {
      const timeSlots = ["08:00 - Sáng", "14:00 - Chiều", "19:00 - Tối"];
      
      daySpots.forEach((spot, idx) => {
        const slotText = timeSlots[idx] || "Thời gian tự chọn";
        const absoluteIndex = dayStartIndex + idx;
        const isFirst = absoluteIndex === 0;
        const isLast = absoluteIndex === this.state.itinerary.length - 1;
        
        let travelSection = '';
        // If there's a next spot, calculate travel distance
        if (idx < daySpots.length - 1) {
          const nextSpot = daySpots[idx + 1];
          const route = GIA_LAI_DATA.getRouteDetails(spot.id, nextSpot.id);
          travelSection = `
            <div class="timeline-travel-info">
              <i class="fas fa-route"></i>
              <span>Di chuyển: <strong>${route.distance}</strong> (${route.duration}) bằng Xe máy/Ô tô</span>
            </div>
          `;
        }

        const formattedPrice = spot.price === 0 ? "Miễn phí" : spot.price.toLocaleString('vi-VN') + "đ";

        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-time">${slotText}</div>
          <div class="timeline-card glass-panel">
            <div class="timeline-card-image" style="background-image: url('${spot.image}')">
              ${spot.isGreen ? '<span class="spot-eco-badge"><i class="fas fa-leaf"></i> Eco-friendly</span>' : ''}
            </div>
            <div class="timeline-card-body">
              <div class="spot-card-meta">
                <span class="spot-card-category"><i class="fas fa-tags"></i> ${spot.tags.join(', ')}</span>
                <span class="spot-card-rating"><i class="fas fa-star text-gold"></i> ${spot.rating}</span>
              </div>
              <h4 class="spot-card-title">${spot.name}</h4>
              <p class="spot-card-desc">${spot.description.substring(0, 80)}...</p>
              
              <div class="spot-card-footer">
                <div class="spot-price">Giá vé: <span>${formattedPrice}</span></div>
                <div class="spot-card-actions">
                  <button class="btn-spot-icon btn-spot-detail" data-spot-id="${spot.id}" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                  <button class="btn-spot-icon btn-spot-ask" data-spot-name="${spot.name}" title="Hỏi AI"><i class="fas fa-comment-alt"></i></button>
                  <button class="btn-spot-icon" onclick="APP.moveSpotInItinerary('${spot.id}', -1)" title="Di chuyển lên" ${isFirst ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}><i class="fas fa-arrow-up"></i></button>
                  <button class="btn-spot-icon" onclick="APP.moveSpotInItinerary('${spot.id}', 1)" title="Di chuyển xuống" ${isLast ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}><i class="fas fa-arrow-down"></i></button>
                  <button class="btn-spot-icon text-warning" onclick="APP.swapSpotInItinerary('${spot.id}')" title="Đổi địa điểm"><i class="fas fa-sync-alt"></i></button>
                  <button class="btn-spot-icon text-danger" onclick="APP.deleteSpotFromItinerary('${spot.id}')" title="Xóa"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            </div>
          </div>
          ${travelSection}
        `;
        timelineContainer.appendChild(item);
      });
    }

    // 4. Update stats cards
    this.calculateItineraryStats();
    
    // 5. Update weather advice card
    this.updateWeatherWidget();
  },

  switchItineraryDay: function(day) {
    this.state.activeItineraryDay = day;
    this.renderItineraryTimeline();
    
    // Zoom/Center map to day's active locations
    if (this.map) {
      const spotsPerDay = 3;
      const dayStartIndex = (day - 1) * spotsPerDay;
      const daySpots = this.state.itinerary.slice(dayStartIndex, dayStartIndex + spotsPerDay);
      if (daySpots.length > 0) {
        const bounds = L.latLngBounds(daySpots.map(s => s.coordinates));
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  },

  calculateItineraryStats: function() {
    // Total price
    let spotTicketCost = this.state.itinerary.reduce((sum, spot) => sum + spot.price, 0);
    
    // Factor in accommodation & food based on budget multiplier
    let factor = 300000; // standard budget daily rate per person
    if (this.state.tripDetails.budget === 'low') factor = 150000;
    if (this.state.tripDetails.budget === 'high') factor = 800000;

    const totalEstimate = spotTicketCost + (factor * this.state.tripDetails.days * this.state.tripDetails.guests);
    
    document.getElementById('stat-total-cost').innerText = totalEstimate.toLocaleString('vi-VN') + "đ";

    // Match score % calculation
    // Calculate how many categories user chose that are satisfied in the itinerary
    const prefList = Array.from(this.state.preferences);
    if (prefList.length === 0) {
      document.getElementById('stat-match-percentage').innerText = "100%";
      const circleText = document.getElementById('stat-match-percentage-text');
      if (circleText) circleText.innerText = "100%";
    } else {
      let matchedCount = 0;
      this.state.itinerary.forEach(spot => {
        const matches = spot.category.some(c => prefList.includes(c));
        if (matches) matchedCount++;
      });
      const matchScore = Math.min(100, Math.round((matchedCount / this.state.itinerary.length) * 100) + 20); // added bonus baseline
      document.getElementById('stat-match-percentage').innerText = matchScore + "%";
      
      const circleText = document.getElementById('stat-match-percentage-text');
      if (circleText) circleText.innerText = matchScore + "%";

      // Update circular indicator offset if any
      const circle = document.querySelector('.circle-progress');
      if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (matchScore / 100) * circumference;
        circle.style.strokeDashoffset = offset;
      }
    }

    // Green eco score
    const totalGreen = this.state.itinerary.reduce((sum, spot) => sum + spot.greenScore, 0);
    const avgGreen = Math.round(totalGreen / this.state.itinerary.length) || 75;
    
    const greenContainer = document.getElementById('stat-green-score');
    if (greenContainer) {
      greenContainer.innerText = avgGreen + "%";
    }
  },

  updateWeatherWidget: function() {
    const hash = this.state.tripDetails.days + this.state.activeItineraryDay;
    const weather = GIA_LAI_DATA.weatherForecasts[hash % GIA_LAI_DATA.weatherForecasts.length];

    const iconEl = document.getElementById('weather-icon');
    const tempEl = document.getElementById('weather-temp');
    const statusEl = document.getElementById('weather-status');
    const descEl = document.getElementById('weather-desc');
    const suitEl = document.getElementById('weather-suit');

    if (iconEl && tempEl) {
      iconEl.className = `fas ${weather.icon}`;
      tempEl.innerText = weather.temp;
      statusEl.innerText = weather.name;
      descEl.innerText = weather.text;
      suitEl.innerText = weather.suit;
    }
  },

  // Interactive Maps Handler (LeafletJS Dark Mode integration)
  initMap: function() {
    const mapElement = document.getElementById('map-container');
    if (!mapElement) return;

    // Reset container if map already exists to prevent re-initialization error
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Initial center on Pleiku
    this.map = L.map('map-container', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([14.004124, 108.012145], 11);

    // Add CartoDB Voyager map tiles (looks clean and matching the bright theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(this.map);

    this.updateMapRoute();
  },

  // Update Markers and Routes
  updateMapRoute: function() {
    if (!this.map) return;

    // Clear old markers
    this.mapMarkers.forEach(m => this.map.removeLayer(m));
    this.mapMarkers = [];
    if (this.mapPolylines) {
      this.map.removeLayer(this.mapPolylines);
      this.mapPolylines = null;
    }

    // Get spots for the active day to render routing polyline
    const spotsPerDay = 3;
    const dayStartIndex = (this.state.activeItineraryDay - 1) * spotsPerDay;
    const daySpots = this.state.itinerary.slice(dayStartIndex, dayStartIndex + spotsPerDay);

    if (daySpots.length === 0) return;

    const latlngs = [];

    // Create markers with custom styled icons matching theme colors
    daySpots.forEach((spot, idx) => {
      latlngs.push(spot.coordinates);

      // Neon-teal marker icon for culture/nature, gold for cuisine
      const color = spot.category.includes('cuisine') ? '#FFD700' : '#00F2FE';
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="marker-pulse" style="background-color: ${color}"></div>
          <div class="marker-pin" style="background-color: ${color}">
            <span>${idx + 1}</span>
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      const marker = L.marker(spot.coordinates, { icon: customIcon })
        .addTo(this.map)
        .bindPopup(`
          <div class="map-popup-card">
            <h5>${spot.name}</h5>
            <p>${spot.description.substring(0, 60)}...</p>
            <button class="btn-popup-view" onclick="APP.showSpotDetails('${spot.id}')">Xem chi tiết</button>
          </div>
        `);
      
      this.mapMarkers.push(marker);
    });

    // Draw route connecting spots
    if (latlngs.length > 1) {
      this.mapPolylines = L.polyline(latlngs, {
        color: '#00F2FE',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(this.map);

      // Fit map bounds to encompass markers
      const bounds = L.latLngBounds(latlngs);
      this.map.fitBounds(bounds, { padding: [40, 40] });
    } else if (latlngs.length === 1) {
      this.map.setView(latlngs[0], 13);
    }
  },

  // Detail Drawer displayer
  showSpotDetails: function(spotId) {
    const spot = GIA_LAI_DATA.spots.find(s => s.id === spotId);
    if (!spot) return;

    const modal = document.getElementById('spot-detail-modal');
    if (!modal) return;

    // Populate contents
    document.getElementById('detail-image').style.backgroundImage = `url('${spot.image}')`;
    document.getElementById('detail-title').innerText = spot.name;
    document.getElementById('detail-rating-text').innerText = `${spot.rating} (${spot.reviewsCount} đánh giá)`;
    document.getElementById('detail-desc').innerText = spot.description;
    document.getElementById('detail-hours').innerText = spot.openingHours;
    document.getElementById('detail-price').innerText = spot.price === 0 ? "Miễn phí" : spot.price.toLocaleString('vi-VN') + "đ";
    document.getElementById('detail-tip').innerText = spot.tip || "Tham quan tự do, giữ vệ sinh môi trường.";
    
    // Green score tag
    const greenEl = document.getElementById('detail-green-score');
    if (greenEl) {
      greenEl.innerText = `${spot.greenScore}% Du lịch xanh`;
    }

    // Google Maps direction link
    const directionsBtn = document.getElementById('btn-detail-directions');
    if (directionsBtn) {
      directionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${spot.coordinates[0]},${spot.coordinates[1]}`;
    }

    // Action button within detail drawer to add/remove
    const addRemoveBtn = document.getElementById('btn-detail-itinerary-toggle');
    if (addRemoveBtn) {
      const exists = this.state.itinerary.some(s => s.id === spotId);
      if (exists) {
        addRemoveBtn.innerText = "Xóa khỏi lịch trình";
        addRemoveBtn.className = "btn-secondary w-full mt-4";
        addRemoveBtn.onclick = () => {
          this.deleteSpotFromItinerary(spotId);
          modal.classList.remove('active');
        };
      } else {
        addRemoveBtn.innerText = "Thêm vào lịch trình";
        addRemoveBtn.className = "btn-primary w-full mt-4";
        addRemoveBtn.onclick = () => {
          this.state.itinerary.push(spot);
          this.renderItineraryTimeline();
          this.initMap();
          this.showToast(`Đã thêm ${spot.name}!`);
          modal.classList.remove('active');
        };
      }
    }

    // Show drawer
    modal.classList.add('active');
  },

  // --- AI Co-pilot Chatbot UI Logic ---

  handleChatInput: async function() {
    const inputEl = document.getElementById('chat-text-input');
    const query = inputEl.value.trim();
    if (!query) return;

    inputEl.value = '';
    
    // 1. Render User message in chat
    this.appendChatMessage('user', query);

    // 2. Play typing indicator
    const typingId = this.showChatTypingIndicator();

    try {
      // Send API request to Gemini
      const currentItineraryCopy = [...this.state.itinerary];
      const result = await AI_AGENT.sendMessage(query, currentItineraryCopy);
      
      // Remove typing bubble
      this.removeChatTypingIndicator(typingId);

      // 3. Render AI response text
      this.appendChatMessage('assistant', result.text);

      // 4. Voice read output if AI Voice toggle is enabled
      const speechEnabled = document.getElementById('cb-voice-output')?.checked;
      if (speechEnabled) {
        AI_AGENT.speak(result.text, this.state.currentLang === 'vi' ? 'vi-VN' : 'en-US');
      }

      // Check gourmet achievements in AI replies
      if (query.toLowerCase().includes('ăn') || query.toLowerCase().includes('món ngon') || query.toLowerCase().includes('phở') || query.toLowerCase().includes('gà nướng')) {
        this.checkAndAwardBadge('gourmet');
      }

      // 5. Update itinerary if AI returned a JSON list
      if (result.updatedSpots) {
        const newSpots = [];
        result.updatedSpots.forEach(id => {
          const spot = GIA_LAI_DATA.spots.find(s => s.id === id);
          if (spot) newSpots.push(spot);
        });

        if (newSpots.length > 0) {
          this.state.itinerary = newSpots;
          
          // Re-render Itinerary views
          this.renderItineraryTimeline();
          
          // Flash toast with highlights
          this.showToast("Lịch trình đã tự động cập nhật bởi AI!");
          this.triggerConfetti();
        }
      }

    } catch (err) {
      this.removeChatTypingIndicator(typingId);
      this.appendChatMessage('assistant', `⚠️ Lỗi: ${err.message}`);
      
      // Auto open settings modal to input API key if empty key error
      if (err.message.includes('API Key')) {
        setTimeout(() => {
          document.getElementById('settings-modal').classList.add('active');
        }, 1500);
      }
    }
  },

  appendChatMessage: function(role, text) {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    
    // Add text container
    const txtContainer = document.createElement('div');
    txtContainer.className = 'chat-bubble-text';
    txtContainer.innerText = text;
    bubble.appendChild(txtContainer);

    // Audio Speaker trigger button for assistant replies
    if (role === 'assistant') {
      const speakerBtn = document.createElement('button');
      speakerBtn.className = 'btn-chat-speech-speak';
      speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      speakerBtn.title = "Đọc câu trả lời";
      speakerBtn.addEventListener('click', () => {
        AI_AGENT.speak(text, this.state.currentLang === 'vi' ? 'vi-VN' : 'en-US');
      });
      bubble.appendChild(speakerBtn);
    }

    chatBody.appendChild(bubble);
    
    // Smooth scroll chat down
    chatBody.scrollTop = chatBody.scrollHeight;
  },

  showChatTypingIndicator: function() {
    const chatBody = document.getElementById('chat-body');
    const id = 'typing-' + Date.now();
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble assistant typing-bubble';
    bubble.id = id;
    bubble.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
  },

  removeChatTypingIndicator: function(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  // Voice recording toggle
  toggleVoiceRecording: function() {
    if (this.isRecording) {
      this.speechRecognizer.stop();
      this.isRecording = false;
      document.getElementById('btn-chat-mic').classList.remove('recording');
      this.showToast("Đã tắt micro.");
    } else {
      this.speechRecognizer = AI_AGENT.createSpeechRecognizer(
        (transcript) => {
          document.getElementById('chat-text-input').value = transcript;
          this.showToast("Đã nghe: " + transcript);
          // Auto send
          setTimeout(() => this.handleChatInput(), 800);
        },
        (err) => {
          console.error("Lỗi nhận diện giọng nói:", err);
          this.showToast("Không thể nhận diện giọng nói. Thử lại!");
          this.isRecording = false;
          document.getElementById('btn-chat-mic').classList.remove('recording');
        },
        () => {
          this.isRecording = true;
          document.getElementById('btn-chat-mic').classList.add('recording');
          this.showToast("Đang lắng nghe... Hãy nói đi!");
        },
        () => {
          this.isRecording = false;
          document.getElementById('btn-chat-mic').classList.remove('recording');
        }
      );

      if (this.speechRecognizer) {
        // Toggle language in voice configuration matches layout lang
        this.speechRecognizer.lang = this.state.currentLang === 'vi' ? 'vi-VN' : 'en-US';
        this.speechRecognizer.start();
      } else {
        this.showToast("Trình duyệt không hỗ trợ voice input.");
      }
    }
  },

  // --- Gamification Achievements Badge System ---

  checkAndAwardBadge: function(badgeId) {
    if (this.state.unlockedBadges.has(badgeId)) return;

    this.state.unlockedBadges.add(badgeId);
    localStorage.setItem('unlocked_badges', JSON.stringify(Array.from(this.state.unlockedBadges)));

    const badge = GIA_LAI_DATA.badges.find(b => b.id === badgeId);
    if (!badge) return;

    // Trigger celebration fireworks
    this.triggerConfetti();

    // Show custom modal overlay
    const overlay = document.getElementById('achievement-unlocked-overlay');
    if (overlay) {
      overlay.querySelector('.badge-icon').innerText = badge.icon;
      overlay.querySelector('.badge-title').innerText = badge.name;
      overlay.querySelector('.badge-desc').innerText = badge.desc;
      overlay.classList.add('active');

      // Auto hide in 4s
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 4000);
    }

    this.checkBadgesUI();
  },

  checkBadgesUI: function() {
    const list = document.getElementById('badges-grid-container');
    if (!list) return;

    list.innerHTML = '';
    
    GIA_LAI_DATA.badges.forEach(badge => {
      const isUnlocked = this.state.unlockedBadges.has(badge.id);
      
      const item = document.createElement('div');
      item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `
        <div class="badge-visual">${badge.icon}</div>
        <div class="badge-info">
          <h5>${badge.name}</h5>
          <p>${badge.desc}</p>
          <span class="badge-status-tag">${isUnlocked ? 'Đã đạt được' : 'Chưa mở khóa'}</span>
        </div>
      `;
      list.appendChild(item);
    });
  },

  // Confetti helper
  triggerConfetti: function() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  },

  // --- Share Postcard Generator (HTML Canvas Card builder) ---

  generateShareCard: function() {
    const canvas = document.getElementById('share-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    // 1. Draw solid dark-teal gradient bg
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, '#062828');
    grad.addColorStop(1, '#021515');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // 2. Decorative elements (outer border and glowing effects)
    ctx.strokeStyle = '#00F2FE';
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, 570, 370);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, 560, 360);

    // 3. Draw Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px "Outfit", sans-serif';
    ctx.fillText('SMART TRAVEL GIA LAI', 50, 65);

    ctx.fillStyle = '#00F2FE';
    ctx.font = '16px "Inter", sans-serif';
    ctx.fillText('Lịch trình thông minh tối ưu hóa bởi AI', 50, 90);

    // 4. Trip Stats summary
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(50, 110, 500, 70);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.fillText(this.state.tripDetails.days + ' Ngày ' + (this.state.tripDetails.days - 1) + ' Đêm', 70, 140);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText('Ngân sách: ' + document.getElementById('stat-total-cost').innerText, 70, 163);

    ctx.fillStyle = '#00F2FE';
    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.fillText(document.getElementById('stat-match-percentage').innerText, 440, 140);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText('Độ phù hợp', 440, 163);

    // 5. Itinerary overview spots (up to 4 places)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillText('Điểm đến tiêu biểu:', 50, 215);

    let offset = 250;
    const spotsToShow = this.state.itinerary.slice(0, 4);
    
    spotsToShow.forEach((spot, index) => {
      // Draw number badge
      ctx.fillStyle = '#00F2FE';
      ctx.beginPath();
      ctx.arc(60, offset - 5, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#021515';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(index + 1, 57, offset - 1);

      // Draw Spot name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '15px "Inter", sans-serif';
      ctx.fillText(spot.name, 85, offset);
      
      // Draw coordinates or categories
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillText(spot.tags.join(' | '), 320, offset);

      offset += 32;
    });

    // 6. Watermark at bottom right
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'italic 12px "Inter", sans-serif';
    ctx.fillText('Quét QR / Truy cập để khám phá Gia Lai', 360, 360);
  },

  downloadShareCard: function() {
    const canvas = document.getElementById('share-canvas');
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Smart_Travel_Gia_Lai_Itinerary.png`;
    link.href = dataURL;
    link.click();
    this.showToast('Đã tải xuống ảnh chia sẻ lịch trình!');
  },

  renderExplorePlaces: function(category = 'all', searchQuery = '') {
    const list = document.getElementById('explore-list');
    if (!list) return;

    list.innerHTML = '';
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = GIA_LAI_DATA.spots.filter(spot => {
      const matchCat = category === 'all' || spot.category.includes(category);
      const matchQuery = !query || spot.name.toLowerCase().includes(query) || spot.description.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state-card" style="grid-column: 1/-1;">Không tìm thấy địa điểm phù hợp.</div>';
      return;
    }

    filtered.forEach(spot => {
      const isAlreadyInItinerary = this.state.itinerary.some(s => s.id === spot.id);
      const formattedPrice = spot.price === 0 ? "Miễn phí" : spot.price.toLocaleString('vi-VN') + "đ";

      const card = document.createElement('div');
      card.className = 'explore-card glass-panel';
      card.innerHTML = `
        <div class="explore-card-img" style="background-image: url('${spot.image}')"></div>
        <div class="explore-card-body">
          <div class="explore-card-meta">
            <span class="explore-rating"><i class="fas fa-star text-gold"></i> ${spot.rating}</span>
            <span class="explore-price">${formattedPrice}</span>
          </div>
          <h4>${spot.name}</h4>
          <p>${spot.description.substring(0, 70)}...</p>
          <div class="explore-card-actions">
            <button class="btn-spot-detail btn-explore-action" data-spot-id="${spot.id}" style="color:var(--primary); font-size:12px; font-weight:600; cursor:pointer;"><i class="fas fa-info-circle"></i> Chi tiết</button>
            ${isAlreadyInItinerary ? 
              `<button class="btn-explore-add" disabled style="background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: not-allowed; padding:6px 12px; border-radius:6px; font-size:12px;"><i class="fas fa-check"></i> Đã thêm</button>` : 
              `<button class="btn-explore-add btn-primary-micro" onclick="APP.addSpotToItineraryManual('${spot.id}')" style="background: var(--primary); color: var(--bg-primary); padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;"><i class="fas fa-plus"></i> Thêm</button>`
            }
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  },

  addSpotToItineraryManual: function(spotId) {
    const spot = GIA_LAI_DATA.spots.find(s => s.id === spotId);
    if (!spot) return;
    
    // Add to itinerary
    this.state.itinerary.push(spot);
    
    // Recalculate days count if itinerary length exceeds days * 3
    const maxSpots = this.state.tripDetails.days * 3;
    if (this.state.itinerary.length > maxSpots) {
      this.state.tripDetails.days = Math.ceil(this.state.itinerary.length / 3);
      this.setDefaultEndDateFromDays();
    }

    this.renderItineraryTimeline();
    this.renderExplorePlaces(this.state.activeExploreCategory, document.getElementById('explore-search-input')?.value || '');
    this.initMap();
    this.showToast(`Đã thêm ${spot.name} vào lịch trình!`);
    this.triggerConfetti();
  },

  setDefaultEndDateFromDays: function() {
    const startInput = document.getElementById('input-start-date');
    const endInput = document.getElementById('input-end-date');
    if (startInput && endInput && startInput.value) {
      const start = new Date(startInput.value);
      const end = new Date(start);
      end.setDate(start.getDate() + this.state.tripDetails.days - 1);
      endInput.value = end.toISOString().split('T')[0];
    }
  },

  loadPrebuiltItinerary: function(type = 'standard') {
    const ids = ['bien-ho', 'chua-minh-thanh', 'cho-dem-pleiku', 'chu-dang-ya', 'lang-op', 'ca-phe-thu-ha', 'thac-phu-cuong', 'hang-thong-tram-tuoi', 'quan-pho-hong'];
    const selected = [];
    ids.forEach(id => {
      const spot = GIA_LAI_DATA.spots.find(s => s.id === id);
      if (spot) selected.push(spot);
    });

    this.state.itinerary = selected;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(tomorrow.getDate() + 2); // 3 days trip

    this.state.tripDetails = {
      destination: 'Gia Lai',
      startLoc: 'TP. Hồ Chí Minh',
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: dayAfter.toISOString().split('T')[0],
      days: 3,
      guests: 2,
      budget: 'medium'
    };
    
    this.state.activeItineraryDay = 1;
    this.renderItineraryTimeline();
    
    // Auto center map and update
    this.navigateTo('screen-itinerary');
    this.showToast('Đã tải lịch trình 3 ngày đề xuất!');
    this.triggerConfetti();
  }
};

// Start application when page is loaded
window.addEventListener('DOMContentLoaded', () => {
  APP.init();
});
