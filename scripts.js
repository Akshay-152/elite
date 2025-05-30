// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNl1eLCccchmMvUNf29EtTUbMn_FO_nuU",
    authDomain: "data-4e1c7.firebaseapp.com",
    projectId: "data-4e1c7",
    storageBucket: "data-4e1c7.firebasestorage.app",
    messagingSenderId: "844230746094",
    appId: "1:844230746094:web:7834ae9aaf29eccc3d38ff",
    measurementId: "G-L4ZQ1CL7T8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global State Management
let currentUser = null;
let currentDatabase = null;
let cart = JSON.parse(localStorage.getItem('elite_cart')) || [];
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSort = 'newest';
let darkMode = localStorage.getItem('elite_darkMode') === 'true';

// Authentication credentials mapping
const userCredentials = {
    '1234': { password: '1234', database: 'products1lap' },
    '123456': { password: '123456', database: 'products2lap' }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

// Application Initialization
function initializeApp() {
    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
    
    // Set initial theme
    setTheme(darkMode);
    
    // Load products
    loadProducts();
    
    // Update cart UI
    updateCartUI();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize scroll handlers
    initializeScrollHandlers();
}

// Event Listeners Initialization
function initializeEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    mobileMenuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('open');
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
    
    // Dark mode toggles
    const darkModeToggle = document.getElementById('darkModeToggle');
    const mobileDarkModeToggle = document.getElementById('mobileDarkModeToggle');
    
    darkModeToggle.addEventListener('click', toggleDarkMode);
    mobileDarkModeToggle.addEventListener('click', () => {
        toggleDarkMode();
        closeMobileMenu();
    });
    
    // Category filter buttons
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.getAttribute('data-category');
            setActiveCategory(category);
            filterProducts();
        });
    });
    
    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    sortFilter.addEventListener('change', (e) => {
        currentSort = e.target.value;
        sortProducts();
        displayProducts();
    });
    
    // Close modals on backdrop click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            closeAllModals();
        }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Scroll Handlers
function initializeScrollHandlers() {
    // Go to top button
    window.addEventListener('scroll', () => {
        const goTopBtn = document.getElementById('goTopBtn');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 300) {
            goTopBtn.classList.remove('hidden');
        } else {
            goTopBtn.classList.add('hidden');
        }
    });
}

// Utility Functions
function lockScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.classList.add('scroll-locked');
}

function unlockScroll() {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('scroll-locked');
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToProducts() {
    const productsSection = document.getElementById('productsSection');
    productsSection.scrollIntoView({ behavior: 'smooth' });
}

function goHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Theme Management
function setTheme(isDark) {
    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem('elite_darkMode', isDark.toString());
    darkMode = isDark;
}

function toggleDarkMode() {
    setTheme(!darkMode);
}

// Mobile Menu Functions
function openMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    mobileMenu.classList.add('open');
    mobileMenuBtn.classList.add('open');
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/30 z-30';
    backdrop.id = 'mobileMenuBackdrop';
    backdrop.addEventListener('click', closeMobileMenu);
    document.body.appendChild(backdrop);
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    
    mobileMenu.classList.remove('open');
    mobileMenuBtn.classList.remove('open');
    
    if (backdrop) {
        backdrop.remove();
    }
}

// Search Functionality
function handleSearch(event) {
    event.preventDefault();
    const searchInput = event.target.querySelector('input');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.uniqueCode && product.uniqueCode.toLowerCase().includes(searchTerm))
        );
    }
    
    sortProducts();
    displayProducts();
    
    // Clear mobile search and close menu if on mobile
    if (event.target.closest('#mobileMenu')) {
        closeMobileMenu();
    }
}

// Authentication Functions
function handleAuthClick() {
    if (currentUser) {
        showLogoutConfirmation();
    } else {
        openAuthModal();
    }
}

function openAuthModal() {
    lockScroll();
    const modal = document.getElementById('authModal');
    modal.classList.remove('hidden');
    modal.classList.add('modal-backdrop');
    setTimeout(() => {
        modal.querySelector('.bg-white').classList.add('animate-scaleIn');
    }, 10);
}

function closeAuthModal() {
    unlockScroll();
    const modal = document.getElementById('authModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-backdrop');
    document.getElementById('authForm').reset();
    hideError('authError');
}

function handleAuth(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('authError', 'Please enter both username and password');
        return;
    }
    
    if (userCredentials[username] && userCredentials[username].password === password) {
        currentUser = username;
        currentDatabase = userCredentials[username].database;
        
        // Update UI for logged in user
        updateAuthUI(true);
        
        closeAuthModal();
        showSuccess(`Welcome back, Partner ${username}!`);
        
        // Reload products to include user's database
        loadProducts();
    } else {
        showError('authError', 'Invalid credentials. Please check your username and password.');
    }
}

function showLogoutConfirmation() {
    if (confirm('Are you sure you want to logout?')) {
        logout();
    }
}

function logout() {
    currentUser = null;
    currentDatabase = null;
    
    // Update UI for logged out user
    updateAuthUI(false);
    
    showSuccess('Logged out successfully!');
    loadProducts();
}

function updateAuthUI(isLoggedIn) {
    const loginText = document.getElementById('loginText');
    const mobileLoginText = document.getElementById('mobileLoginText');
    const uploadBtn = document.getElementById('uploadBtn');
    const mobileUploadBtn = document.getElementById('mobileUploadBtn');
    
    if (isLoggedIn) {
        loginText.textContent = `Partner ${currentUser}`;
        mobileLoginText.textContent = `Partner ${currentUser}`;
        uploadBtn.classList.remove('hidden');
        mobileUploadBtn.classList.remove('hidden');
    } else {
        loginText.textContent = 'Partner Login';
        mobileLoginText.textContent = 'Partner Login';
        uploadBtn.classList.add('hidden');
        mobileUploadBtn.classList.add('hidden');
    }
}

// Product Upload Functions
function openUploadModal() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    lockScroll();
    const modal = document.getElementById('uploadModal');
    modal.classList.remove('hidden');
    modal.classList.add('modal-backdrop');
    setTimeout(() => {
        modal.querySelector('.bg-white').classList.add('animate-scaleIn');
    }, 10);
}

function closeUploadModal() {
    unlockScroll();
    const modal = document.getElementById('uploadModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-backdrop');
    document.getElementById('uploadForm').reset();
    hideError('uploadError');
    
    // Reset image guide toggle
    const toggle = document.querySelector('.definition-toggle');
    if (toggle) {
        toggle.classList.remove('active');
    }
}

function toggleImageGuide() {
    const toggle = document.querySelector('.definition-toggle');
    toggle.classList.toggle('active');
}

function generateUniqueCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `EF${timestamp}${random}`.toUpperCase();
}

async function handleProductUpload(event) {
    event.preventDefault();
    
    if (!currentUser || !currentDatabase) {
        showError('uploadError', 'Please login first');
        return;
    }
    
    const submitBtn = document.getElementById('uploadSubmitBtn');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner inline-block mr-2"></div>Uploading...';
    
    try {
        const formData = new FormData(event.target);
        const uniqueCode = generateUniqueCode();
        
        // Validate required fields
        const name = formData.get('productName').trim();
        const price = parseFloat(formData.get('productPrice'));
        const category = formData.get('productCategory');
        const description = formData.get('productDescription').trim();
        const image = formData.get('productImage').trim();
        
        if (!name || !price || !category || !description || !image) {
            throw new Error('Please fill in all required fields');
        }
        
        if (price <= 0) {
            throw new Error('Price must be greater than 0');
        }
        
        // Validate image URL
        if (!isValidURL(image)) {
            throw new Error('Please enter a valid image URL');
        }
        
        const productData = {
            name: name,
            price: price,
            category: category,
            description: description,
            image: image,
            image2: formData.get('productImage2').trim() || '',
            image3: formData.get('productImage3').trim() || '',
            uniqueCode: uniqueCode,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser,
            rating: Math.floor(Math.random() * 2) + 4, // Random rating 4-5
            reviews: Math.floor(Math.random() * 100) + 10 // Random reviews 10-110
        };
        
        // Validate additional image URLs if provided
        if (productData.image2 && !isValidURL(productData.image2)) {
            throw new Error('Please enter a valid URL for Image 2 or leave it empty');
        }
        if (productData.image3 && !isValidURL(productData.image3)) {
            throw new Error('Please enter a valid URL for Image 3 or leave it empty');
        }
        
        await db.collection(currentDatabase).add(productData);
        
        closeUploadModal();
        showSuccess(`Product uploaded successfully! Code: ${uniqueCode}`);
        loadProducts();
        
    } catch (error) {
        console.error('Error uploading product:', error);
        showError('uploadError', error.message || 'Failed to upload product. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Product Display Functions
async function loadProducts() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productsGrid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    // Show loading state
    loadingSpinner.classList.remove('hidden');
    productsGrid.classList.add('hidden');
    noProducts.classList.add('hidden');
    
    try {
        allProducts = [];
        
        // Load from products1lap collection
        const products1Snapshot = await db.collection('products1lap').get();
        products1Snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.price && data.image) { // Validate essential fields
                allProducts.push({ 
                    id: doc.id, 
                    ...data, 
                    source: 'products1lap',
                    createdAt: data.createdAt || new Date()
                });
            }
        });
        
        // Load from products2lap collection
        const products2Snapshot = await db.collection('products2lap').get();
        products2Snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.price && data.image) { // Validate essential fields
                allProducts.push({ 
                    id: doc.id, 
                    ...data, 
                    source: 'products2lap',
                    createdAt: data.createdAt || new Date()
                });
            }
        });
        
        // Apply current filters and sort
        filterProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showError('loadingError', 'Failed to load products. Please refresh the page.');
        noProducts.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

function setActiveCategory(category) {
    currentCategory = category;
    
    // Update category button states
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.className = 'category-btn whitespace-nowrap px-6 py-3 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-300';
        } else {
            btn.className = 'category-btn whitespace-nowrap px-6 py-3 rounded-full bg-elite-100 dark:bg-elite-700 text-elite-700 dark:text-elite-300 hover:bg-gradient-to-r hover:from-gold-500 hover:to-gold-600 hover:text-white font-semibold transition-all duration-300';
        }
    });
}

function filterProducts() {
    if (currentCategory === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category === currentCategory
        );
    }
    
    sortProducts();
    displayProducts();
}

function sortProducts() {
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'newest':
            default:
                const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return bTime - aTime;
        }
    });
}

function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    if (filteredProducts.length === 0) {
        productsGrid.classList.add('hidden');
        noProducts.classList.remove('hidden');
        return;
    }
    
    productsGrid.classList.remove('hidden');
    noProducts.classList.add('hidden');
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card bg-white dark:bg-elite-800 rounded-xl shadow-lg overflow-hidden cursor-pointer group" onclick="openProductModal('${product.id}', '${product.source}')">
            <div class="relative overflow-hidden">
                <img src="${product.image}" alt="${escapeHtml(product.name)}" class="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy">
                <div class="absolute top-3 right-3">
                    <span class="badge-new text-white text-xs px-3 py-1 rounded-full font-semibold">New</span>
                </div>
                <div class="absolute top-3 left-3">
                    <span class="bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-mono">#${product.uniqueCode || 'N/A'}</span>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-6">
                <h3 class="font-bold text-elite-900 dark:text-white mb-3 line-clamp-2 text-lg leading-tight">${escapeHtml(product.name)}</h3>
                <div class="flex items-center mb-3">
                    <div class="flex items-center">
                        ${generateStars(product.rating || 4)}
                    </div>
                    <span class="text-sm text-elite-600 dark:text-elite-400 ml-2">(${product.reviews || 0})</span>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-2xl font-bold text-gradient">₹${formatPrice(product.price)}</span>
                    <span class="text-xs text-elite-500 dark:text-elite-400 bg-elite-100 dark:bg-elite-700 px-2 py-1 rounded-full">
                        ${product.source === 'products1lap' ? 'Partner 1' : 'Partner 2'}
                    </span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="event.stopPropagation(); buyNow('${product.id}', '${product.source}')" 
                            class="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                        Buy Now
                    </button>
                    <button onclick="event.stopPropagation(); addToCart('${product.id}', '${product.source}')" 
                            class="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars.push('<svg class="w-4 h-4 star-filled" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>');
        } else {
            stars.push('<svg class="w-4 h-4 star-empty" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>');
        }
    }
    return stars.join('');
}

function clearFilters() {
    // Reset search inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('mobileSearchInput').value = '';
    
    // Reset category filter
    setActiveCategory('all');
    
    // Reset sort filter
    document.getElementById('sortFilter').value = 'newest';
    currentSort = 'newest';
    
    // Reload all products
    filteredProducts = [...allProducts];
    sortProducts();
    displayProducts();
}

// Product Detail Modal
function openProductModal(productId, source) {
    const product = allProducts.find(p => p.id === productId && p.source === source);
    if (!product) {
        showError('productError', 'Product not found');
        return;
    }
    
    lockScroll();
    const modal = document.getElementById('productModal');
    const content = document.getElementById('productModalContent');
    
    // Build image gallery with slider navigation
    const images = [product.image, product.image2, product.image3].filter(img => img && img.trim());
    currentProductImages = images;
    currentImageIndex = 0;
    const imageGallery = images.length > 1 ? `
        <div class="space-y-4">
            <div id="mainImageContainer" class="relative group">
                <img id="mainImage" src="${images[0]}" alt="${escapeHtml(product.name)}" class="w-full h-96 object-cover rounded-lg transition-transform duration-300">
                <button onclick="previousImage()" class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <button onclick="nextImage()" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    ${images.map((_, index) => `
                        <button onclick="goToImage(${index})" class="w-2 h-2 rounded-full transition-all duration-300 ${index === 0 ? 'bg-white' : 'bg-white/50'}"></button>
                    `).join('')}
                </div>
            </div>
            <div class="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
                ${images.map((img, index) => `
                    <img src="${img}" alt="${escapeHtml(product.name)}" 
                         class="w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all duration-300 flex-shrink-0 ${index === 0 ? 'border-gold-500' : 'border-transparent hover:border-gold-300'}" 
                         onclick="changeMainImage('${img}', ${index})"
                         data-image-index="${index}">
                `).join('')}
            </div>
        </div>
    ` : `
        <img src="${product.image}" alt="${escapeHtml(product.name)}" class="w-full h-96 object-cover rounded-lg">
    `;
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-serif font-bold text-elite-900 dark:text-white">Product Details</h2>
            <button onclick="closeProductModal()" class="text-elite-500 hover:text-elite-700 dark:hover:text-elite-300 transition-colors duration-300">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                ${imageGallery}
            </div>
            
            <div class="space-y-6">
                <div>
                    <h1 class="text-2xl lg:text-3xl font-bold text-elite-900 dark:text-white mb-2">${escapeHtml(product.name)}</h1>
                    <p class="text-elite-600 dark:text-elite-400 text-lg">${escapeHtml(product.description)}</p>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                        ${generateStars(product.rating || 4)}
                    </div>
                    <span class="text-elite-600 dark:text-elite-400">(${product.reviews || 0} reviews)</span>
                </div>
                
                <div class="bg-elite-50 dark:bg-elite-700 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-elite-700 dark:text-elite-300 font-medium">Price:</span>
                        <span class="text-3xl font-bold text-gradient">₹${formatPrice(product.price)}</span>
                    </div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-elite-700 dark:text-elite-300 font-medium">Category:</span>
                        <span class="text-elite-900 dark:text-white font-semibold">${product.category}</span>
                    </div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-elite-700 dark:text-elite-300 font-medium">Product Code:</span>
                        <span class="font-mono text-elite-900 dark:text-white">#${product.uniqueCode || 'N/A'}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-elite-700 dark:text-elite-300 font-medium">Partner:</span>
                        <span class="text-elite-900 dark:text-white font-semibold">
                            ${product.source === 'products1lap' ? 'Partner 1' : 'Partner 2'}
                        </span>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <button onclick="buyNow('${product.id}', '${product.source}')" 
                            class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                        🛒 Buy Now - ₹${formatPrice(product.price)}
                    </button>
                    
                    <button onclick="addToCart('${product.id}', '${product.source}'); closeProductModal();" 
                            class="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                        Add to Cart - ₹${formatPrice(product.price)}
                    </button>
                    
                    <button onclick="closeProductModal()" 
                            class="w-full border-2 border-elite-300 dark:border-elite-600 text-elite-700 dark:text-elite-300 hover:bg-elite-100 dark:hover:bg-elite-700 px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-300">
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('modal-backdrop');
    setTimeout(() => {
        content.classList.add('animate-scaleIn');
    }, 10);
}

function closeProductModal() {
    unlockScroll();
    const modal = document.getElementById('productModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-backdrop');
}

// Global variable to track current image index
let currentImageIndex = 0;
let currentProductImages = [];

function changeMainImage(newSrc, index) {
    const mainImg = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('[data-image-index]');
    const indicators = document.querySelectorAll('.w-2.h-2.rounded-full');
    
    if (mainImg) {
        mainImg.src = newSrc;
        currentImageIndex = index;
        
        // Update thumbnail borders
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.className = thumb.className.replace('border-transparent', 'border-gold-500');
            } else {
                thumb.className = thumb.className.replace('border-gold-500', 'border-transparent');
            }
        });
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.className = indicator.className.replace('bg-white/50', 'bg-white');
            } else {
                indicator.className = indicator.className.replace('bg-white', 'bg-white/50');
            }
        });
    }
}

function previousImage() {
    if (currentProductImages.length > 0) {
        currentImageIndex = (currentImageIndex - 1 + currentProductImages.length) % currentProductImages.length;
        changeMainImage(currentProductImages[currentImageIndex], currentImageIndex);
    }
}

function nextImage() {
    if (currentProductImages.length > 0) {
        currentImageIndex = (currentImageIndex + 1) % currentProductImages.length;
        changeMainImage(currentProductImages[currentImageIndex], currentImageIndex);
    }
}

function goToImage(index) {
    if (currentProductImages.length > 0 && index >= 0 && index < currentProductImages.length) {
        changeMainImage(currentProductImages[index], index);
    }
}

// Shopping Cart Functions
function addToCart(productId, source) {
    const product = allProducts.find(p => p.id === productId && p.source === source);
    if (!product) {
        showError('cartError', 'Product not found');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId && item.source === source);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            source: source,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            uniqueCode: product.uniqueCode
        });
    }
    
    updateCartUI();
    showSuccess(`${product.name} added to cart!`);
}

function removeFromCart(productId, source) {
    cart = cart.filter(item => !(item.id === productId && item.source === source));
    updateCartUI();
    displayCartItems();
    showSuccess('Item removed from cart');
}

function updateCartQuantity(productId, source, newQuantity) {
    const item = cart.find(item => item.id === productId && item.source === source);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId, source);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
            displayCartItems();
        }
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const mobileCartCount = document.getElementById('mobileCartCount');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCount.textContent = count;
    mobileCartCount.textContent = count;
    
    if (count > 0) {
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
    
    localStorage.setItem('elite_cart', JSON.stringify(cart));
}

function openCartModal() {
    lockScroll();
    const modal = document.getElementById('cartModal');
    modal.classList.remove('hidden');
    modal.classList.add('modal-backdrop');
    displayCartItems();
    setTimeout(() => {
        modal.querySelector('.bg-white').classList.add('animate-scaleIn');
    }, 10);
}

function closeCartModal() {
    unlockScroll();
    const modal = document.getElementById('cartModal');
    modal.classList.add('hidden');
    modal.classList.remove('modal-backdrop');
}

function displayCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-12">
                <svg class="w-24 h-24 mx-auto text-elite-300 dark:text-elite-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13v6a1 1 0 001 1h8a1 1 0 001-1v-6M7 13H5.4"></path>
                </svg>
                <h3 class="text-xl font-bold text-elite-900 dark:text-white mb-2">Your cart is empty</h3>
                <p class="text-elite-600 dark:text-elite-400 mb-6">Add some premium products to get started</p>
                <button onclick="closeCartModal()" class="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                    Continue Shopping
                </button>
            </div>
        `;
        cartTotal.innerHTML = '';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 p-4 bg-elite-50 dark:bg-elite-700 rounded-lg">
            <img src="${item.image}" alt="${escapeHtml(item.name)}" class="w-16 h-16 object-cover rounded-lg">
            <div class="flex-1">
                <h4 class="font-semibold text-elite-900 dark:text-white">${escapeHtml(item.name)}</h4>
                <p class="text-sm text-elite-600 dark:text-elite-400">#${item.uniqueCode || 'N/A'}</p>
                <p class="text-lg font-bold text-gradient">₹${formatPrice(item.price)}</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="updateCartQuantity('${item.id}', '${item.source}', ${item.quantity - 1})" 
                        class="w-8 h-8 bg-elite-200 dark:bg-elite-600 rounded-full flex items-center justify-center hover:bg-elite-300 dark:hover:bg-elite-500 transition-colors duration-300">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                    </svg>
                </button>
                <span class="w-8 text-center font-semibold text-elite-900 dark:text-white">${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', '${item.source}', ${item.quantity + 1})" 
                        class="w-8 h-8 bg-elite-200 dark:bg-elite-600 rounded-full flex items-center justify-center hover:bg-elite-300 dark:hover:bg-elite-500 transition-colors duration-300">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                </button>
                <button onclick="removeFromCart('${item.id}', '${item.source}')" 
                        class="ml-2 text-red-500 hover:text-red-700 transition-colors duration-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;
    
    cartTotal.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between text-elite-700 dark:text-elite-300">
                <span>Subtotal:</span>
                <span>₹${formatPrice(subtotal)}</span>
            </div>
            <div class="flex justify-between text-elite-700 dark:text-elite-300">
                <span>Shipping:</span>
                <span>${shipping === 0 ? 'Free' : '₹' + formatPrice(shipping)}</span>
            </div>
            <div class="border-t border-elite-300 dark:border-elite-600 pt-3">
                <div class="flex justify-between text-xl font-bold text-elite-900 dark:text-white">
                    <span>Total:</span>
                    <span class="text-gradient">₹${formatPrice(total)}</span>
                </div>
            </div>
            <button onclick="proceedToCheckout()" 
                    class="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg mt-6">
                Proceed to Checkout
            </button>
        </div>
    `;
}

function proceedToCheckout() {
    // This would typically integrate with a payment system
    showSuccess('Checkout functionality will be implemented with payment gateway integration');
}

function clearCart() {
    cart = [];
    updateCartUI();
    displayCartItems();
    showSuccess('Cart cleared');
}

// Utility Functions for UI
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    } else {
        // Fallback - show as alert
        alert('Error: ' + message);
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-24 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fadeIn max-w-sm';
    successDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-medium">${escapeHtml(message)}</span>
        </div>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 4000);
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Buy Now Function
function buyNow(productId, source) {
    const product = allProducts.find(p => p.id === productId && p.source === source);
    if (!product) {
        showError('buyNowError', 'Product not found');
        return;
    }

    const msg = `Hi! I'm interested in "${product.name}" priced at ₹${product.price}, code = ${product.uniqueCode}`;
    const encodedMsg = encodeURIComponent(msg);
    const targetURL = `https://onlinech0t.blogspot.com/?m=0&message=${encodedMsg}`;

    window.open(targetURL, '_blank');
}

// Toggle Definition Function
function toggleDefinition(el) {
    el.classList.toggle('active');
}

// Close all modals function
function closeAllModals() {
    closeAuthModal();
    closeUploadModal();
    closeProductModal();
    closeCartModal();
    closeMobileMenu();
}

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    showError('globalError', 'An unexpected error occurred. Please refresh the page.');
});

// Handle online/offline status
window.addEventListener('online', () => {
    showSuccess('Connection restored');
});

window.addEventListener('offline', () => {
    showError('connectionError', 'Connection lost. Please check your internet connection.');
});
