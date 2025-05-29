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


// Activate Lucide icons
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});
   


 // Scroll To Top Button
    window.onscroll = function () {
      const btn = document.getElementById("goTopBtn");
      btn.style.display = (document.documentElement.scrollTop > 50) ? "block" : "none";
    };
    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }


// Global State
let currentUser = null;
let currentDatabase = null;
let cart = JSON.parse(localStorage.getItem('flipmart_cart')) || [];
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';

// Authentication credentials mapping
const userCredentials = {
    '1234': { password: '1234', database: 'products1lap' },
    '123456': { password: '123456', database: 'products2lap' }
};

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
    
    localStorage.setItem('flipmart_cart', JSON.stringify(cart));
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Mobile Menu Functions
document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('open');
});

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.remove('open');
}



// Authentication Functions
function openAuthModal() {
    lockScroll();
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    unlockScroll();
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('authForm').reset();
    document.getElementById('authError').classList.add('hidden');
}

function handleAuth(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (userCredentials[username] && userCredentials[username].password === password) {
        currentUser = username;
        currentDatabase = userCredentials[username].database;
        
        // Update UI for logged in user
        document.getElementById('loginText').textContent = `User: ${username}`;
        document.getElementById('mobileLoginText').textContent = `User: ${username}`;
        document.getElementById('uploadBtn').classList.remove('hidden');
        document.getElementById('mobileUploadBtn').classList.remove('hidden');
        
        closeAuthModal();
        showSuccess('Login successful!');
        
        // Reload products to include user's database
        loadProducts();
    } else {
        showError('authError', 'Invalid username or password');
    }
}

function logout() {
    currentUser = null;
    currentDatabase = null;
    
    // Update UI for logged out user
    document.getElementById('loginText').textContent = 'Login';
    document.getElementById('mobileLoginText').textContent = 'partner';
    document.getElementById('uploadBtn').classList.add('hidden');
    document.getElementById('mobileUploadBtn').classList.add('hidden');
    
    showSuccess('Logged out successfully!');
    loadProducts();
}

// Product Upload Functions
function openUploadModal() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    lockScroll();
    document.getElementById('uploadModal').classList.remove('hidden');
}

function closeUploadModal() {
    unlockScroll();
    document.getElementById('uploadModal').classList.add('hidden');
    document.getElementById('uploadForm').reset();
    document.getElementById('uploadError').classList.add('hidden');
}

// Generate unique product code
function generateUniqueCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `FM${timestamp}${random}`.toUpperCase();
}

async function handleProductUpload(event) {
    event.preventDefault();
    
    if (!currentUser || !currentDatabase) {
        showError('uploadError', 'Please login first');
        return;
    }
    
    const submitBtn = document.getElementById('uploadSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner inline-block mr-2"></div>Uploading...';
    
    const formData = new FormData(event.target);
    const uniqueCode = generateUniqueCode();
    
    const productData = {
        name: formData.get('productName'),
        price: parseFloat(formData.get('productPrice')),
        category: formData.get('productCategory'),
        description: formData.get('productDescription'),
        image: formData.get('productImage'),
        image2: formData.get('productImage2') || '',
        image3: formData.get('productImage3') || '',
        uniqueCode: uniqueCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser,
        rating: Math.floor(Math.random() * 2) + 4, // Random rating 4-5
        reviews: Math.floor(Math.random() * 100) + 10 // Random reviews 10-110
    };
    
    try {
        await db.collection(currentDatabase).add(productData);
        closeUploadModal();
        showSuccess(`Product uploaded successfully! Code: ${uniqueCode}`);
        loadProducts();
    } catch (error) {
        console.error('Error uploading product:', error);
        showError('uploadError', 'Failed to upload product. Please try again.');
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload Product';
}

// Product Display Functions
async function loadProducts() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productsGrid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    loadingSpinner.classList.remove('hidden');
    productsGrid.classList.add('hidden');
    noProducts.classList.add('hidden');
    
    try {
        allProducts = [];
        
        // Load from products collection
        const productsSnapshot = await db.collection('products1lap').get();
        productsSnapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data(), source: 'products1lap' });
        });
        
        // Load from products2 collection
        const products2Snapshot = await db.collection('products2lap').get();
        products2Snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data(), source: 'products2lap' });
        });
        
        allProducts = applyPriorityAndRandomOrder(allProducts);

        filterProducts();
       
    } catch (error) {
        console.error('Error loading products:', error);
        noProducts.classList.remove('hidden');
    }
    
    loadingSpinner.classList.add('hidden');
}

function filterProducts() {
    if (currentCategory === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => product.category === currentCategory);
    }
    
    displayProducts();
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
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onclick="openProductModal('${product.id}', '${product.source}')">
            <div class="relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2">
                    <span class="badge-new text-white text-xs px-2 py-1 rounded-full">New</span>
                </div>
                <div class="absolute top-2 left-2">
                    <span class="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">#${product.uniqueCode || 'N/A'}</span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${product.name}</h3>
                <div class="flex items-center mb-2">
                    <div class="flex items-center">
                        ${generateStars(product.rating || 4)}
                    </div>
                    <span class="text-sm text-gray-600 ml-2">(${product.reviews || 0})</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-lg font-bold text-blue-600">₹${product.price}</span>
                    <button onclick="event.stopPropagation(); addToCart('${product.id}', '${product.source}')" 
                            class="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors">
                        Add to Cart
                    </button>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    Source: ${product.source}
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

// Product Detail Modal - WITH SCROLL PREVENTION
function openProductModal(productId, source) {
    const product = allProducts.find(p => p.id === productId && p.source === source);
    if (!product) return;
    
    // Lock background scroll
    lockScroll();
    
    // Prepare alternative images
    const images = [product.image];
    if (product.image2) images.push(product.image2);
    if (product.image3) images.push(product.image3);
    
    const productDetail = document.getElementById('productDetail');
    productDetail.innerHTML = `
        <div class="space-y-4">
            <div class="relative">
                <img id="mainImage" src="${product.image}" alt="${product.name}" class="w-full rounded-lg">
                ${images.length > 1 ? `
                <div class="flex space-x-2 mt-3 justify-center">
                    ${images.map((img, index) => `
                        <img src="${img}" alt="${product.name}" 
                             class="w-16 h-16 object-cover rounded cursor-pointer border-2 ${index === 0 ? 'border-blue-500' : 'border-gray-300'} hover:border-blue-500 transition-colors"
                             onclick="changeMainImage('${img}', this)">
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
        <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900">${product.name}</h2>
            <div class="bg-gray-100 p-2 rounded">
                <span class="text-sm font-medium text-gray-600">Product Code: </span>
                <span class="text-sm font-bold text-blue-600">#${product.uniqueCode || 'N/A'}</span>
            </div>
            <div class="flex items-center space-x-4">
                <span class="text-3xl font-bold text-blue-600">₹${product.price}</span>
                <div class="flex items-center">
                    ${generateStars(product.rating || 3)}
                    <span class="text-sm text-gray-600 ml-2">(${product.reviews || 2} reviews)</span>
                </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">Description</h4>
                <p class="text-gray-700">${product.description}</p>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">Product Details</h4>
                <ul class="space-y-1 text-sm text-gray-700">
                    <li><strong>Category:</strong> ${product.category}</li>
                    <li><strong>Product Code:</strong> #${product.uniqueCode || 'N/A'}</li>
                    ${product.createdBy ? `<li><strong>Added by:</strong> User ${product.createdBy}</li>` : ''}
                </ul>
            </div>
            <div class="flex space-x-4">
                <button onclick="addToCart('${product.id}', '${product.source}')" 
                        class="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors">
                    <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13v6a1 1 0 001 1h8a1 1 0 001-1v-6M7 13H5.4"></path>
                    </svg>
                    Add to Cart
                </button>
                <button onclick="buyNow('${product.id}', '${product.source}')" 
                        class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                    Buy Now
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('productModal').classList.remove('hidden');
}

// Change main image in product modal
function changeMainImage(newSrc, clickedImg) {
    document.getElementById('mainImage').src = newSrc;
    
    // Update border styles
    document.querySelectorAll('#productDetail img[onclick*="changeMainImage"]').forEach(img => {
        img.classList.remove('border-blue-500');
        img.classList.add('border-gray-300');
    });
    clickedImg.classList.remove('border-gray-300');
    clickedImg.classList.add('border-blue-500');
}

function closeProductModal() {
    // Unlock background scroll
    unlockScroll();
    document.getElementById('productModal').classList.add('hidden');
}

// Cart Functions
function addToCart(productId, source) {
    const product = allProducts.find(p => p.id === productId && p.source === source);
    if (!product) return;
    
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
            quantity: 1
        });
    }
    
    updateCartUI();
    showSuccess('Product added to cart!');
}

function removeFromCart(productId, source) {
    cart = cart.filter(item => !(item.id === productId && item.source === source));
    updateCartUI();
    displayCart();
}

function updateQuantity(productId, source, newQuantity) {
    const item = cart.find(item => item.id === productId && item.source === source);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId, source);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
            displayCart();
        }
    }
}

function openCartModal() {
    lockScroll();
    document.getElementById('cartModal').classList.remove('hidden');
    displayCart();
}

function closeCartModal() {
    unlockScroll();
    document.getElementById('cartModal').classList.add('hidden');
}

function displayCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.classList.remove('hidden');
        cartTotal.classList.add('hidden');
        return;
    }
    
    emptyCart.classList.add('hidden');
    cartTotal.classList.remove('hidden');
    
    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
            <div class="flex-1">
                <h4 class="font-semibold text-gray-900">${item.name}</h4>
                <p class="text-sm text-gray-600">$${item.price}</p>
                <p class="text-xs text-gray-500">Source: ${item.source}</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="updateQuantity('${item.id}', '${item.source}', ${item.quantity - 1})" 
                        class="bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300 transition-colors">-</button>
                <span class="px-3 py-1 bg-white border rounded">${item.quantity}</span>
                <button onclick="updateQuantity('${item.id}', '${item.source}', ${item.quantity + 1})" 
                        class="bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300 transition-colors">+</button>
            </div>
            <button onclick="removeFromCart('${item.id}', '${item.source}')" 
                    class="text-red-500 hover:text-red-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
}

function buyNow(productId, source) {
  // Make sure allProducts is accessible here
  const product = allProducts.find(p => p.id === productId && p.source === source);
  if (!product) {
    console.warn("Product not found");
    return;
  }

  // Use consistent fields, e.g., link as unique id
  const msg = `Hi! I'm interested in "${product.name}" priced at ₹${product.price}, code = ${product.uniqueCode}`;
  const encodedMsg = encodeURIComponent(msg);
  const targetURL = `https://onlinech0t.blogspot.com/?m=0&message=${encodedMsg}`;

  window.open(targetURL, '_blank');
}


// Debounce function for search optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced Search Functions with advanced filtering
function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const mobileQuery = document.getElementById('mobileSearchInput').value.toLowerCase().trim();
    
    if (query || mobileQuery) {
        performAdvancedSearch(query || mobileQuery);
    }
}

function performAdvancedSearch(query) {
    if (!query) {
        filteredProducts = [...allProducts];
        displayProducts();
        hideOtherProducts();
        return;
    }
    
    let filtered = [];
    let others = [];
    
    // Advanced search logic
    if (query.startsWith('#')) {
        // Search by unique code
        const codeQuery = query.slice(1).toUpperCase();
        filtered = allProducts.filter(product => 
            product.uniqueCode && product.uniqueCode.toUpperCase() === codeQuery
        );
        others = allProducts.filter(product => 
            !product.uniqueCode || product.uniqueCode.toUpperCase() !== codeQuery
        );
    } else if (query.includes('between')) {
        // Price range search: "between 100 500"
        const nums = query.match(/\d+/g);
        if (nums && nums.length >= 2) {
            const min = parseFloat(nums[0]);
            const max = parseFloat(nums[1]);
            filtered = allProducts.filter(product => 
                product.price >= min && product.price <= max
            );
            others = allProducts.filter(product => 
                product.price < min || product.price > max
            );
        }
    } else if (query.includes('under') || query.includes('below')) {
        // Price under search: "under 500"
        const num = parseFloat(query.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) {
            filtered = allProducts.filter(product => product.price <= num);
            others = allProducts.filter(product => product.price > num);
        }
    } else if (query.includes('above') || query.includes('over')) {
        // Price above search: "above 1000"
        const num = parseFloat(query.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) {
            filtered = allProducts.filter(product => product.price >= num);
            others = allProducts.filter(product => product.price < num);
        }
    } else if (query.includes('₹') || (!isNaN(query) && query.length > 0)) {
        // Exact price search: "₹500" or "500"
        const num = parseFloat(query.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) {
            filtered = allProducts.filter(product => product.price === num);
            others = allProducts.filter(product => product.price !== num);
        }
    } else if (query.includes('category:')) {
        // Category search: "category:electronics"
        const categoryQuery = query.replace('category:', '').trim();
        filtered = allProducts.filter(product => 
            product.category.toLowerCase().includes(categoryQuery)
        );
        others = allProducts.filter(product => 
            !product.category.toLowerCase().includes(categoryQuery)
        );
    } else if (query.includes('user:')) {
        // User search: "user:1234"
        const userQuery = query.replace('user:', '').trim();
        filtered = allProducts.filter(product => 
            product.createdBy && product.createdBy.toString() === userQuery
        );
        others = allProducts.filter(product => 
            !product.createdBy || product.createdBy.toString() !== userQuery
        );
    } else {
        // Regular text search
        filtered = allProducts.filter(product => 
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query) ||
            (product.uniqueCode && product.uniqueCode.toLowerCase().includes(query))
        );
        others = allProducts.filter(product => 
            !product.name.toLowerCase().includes(query) &&
            !product.description.toLowerCase().includes(query) &&
            !product.category.toLowerCase().includes(query) &&
            (!product.uniqueCode || !product.uniqueCode.toLowerCase().includes(query))
        );
    }
    
    filteredProducts = filtered;
    displayProducts();
    
    // Show other products if main search has results
    if (filtered.length > 0) {
        showOtherProducts(others.slice(0, 8));
    } else {
        showNoResultsWithSuggestions(others.slice(0, 8));
    }
    
    // Reset category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
}

function showOtherProducts(otherProducts) {
    if (otherProducts.length === 0) return;
    
    // Create or update other products section
    let otherSection = document.getElementById('otherProductsSection');
    if (!otherSection) {
        otherSection = document.createElement('section');
        otherSection.id = 'otherProductsSection';
        otherSection.className = 'max-w-screen-xl mx-auto px-4 py-8 border-t';
        document.querySelector('main').appendChild(otherSection);
    }
    
    otherSection.innerHTML = `
        <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-900 mb-2">Other Products</h3>
            <p class="text-gray-600">You might also be interested in these products</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            ${otherProducts.map(product => `
                <div class="product-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onclick="openProductModal('${product.id}', '${product.source}')">
                    <div class="relative">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                        <div class="absolute top-2 right-2">
                            <span class="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">Other</span>
                        </div>
                        <div class="absolute top-2 left-2">
                           <span class="bg-black bg-opacity-20 text-white text-xs px-1 py-1 font-light rounded">
  #${product.uniqueCode || 'N/A'}
</span>

                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${product.name}</h3>
                        <div class="flex items-center mb-2">
                            <div class="flex items-center">
                                ${generateStars(product.rating || 4)}
                            </div>
                            <span class="text-sm text-gray-600 ml-2">(${product.reviews || 0})</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-lg font-bold text-blue-600">₹${product.price}</span>
                            <button onclick="event.stopPropagation(); addToCart('${product.id}', '${product.source}')" 
                                    class="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showNoResultsWithSuggestions(suggestions) {
    const noProducts = document.getElementById('noProducts');
    noProducts.innerHTML = `
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4v4H7V9h10z"></path>
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
        <p class="text-gray-600 mb-4">Try different search terms or check out these suggestions:</p>
        <div class="text-sm text-gray-500 space-y-1">
            <p>• Search by code: <span class="font-mono bg-gray-100 px-2 py-1 rounded">#FM123ABC</span></p>
            <p>• Price range: <span class="font-mono bg-gray-100 px-2 py-1 rounded">between 100 500</span></p>
            <p>• Price under: <span class="font-mono bg-gray-100 px-2 py-1 rounded">under 1000</span></p>
            <p>• Category: <span class="font-mono bg-gray-100 px-2 py-1 rounded">category:electronics</span></p>
            <p>• By user: <span class="font-mono bg-gray-100 px-2 py-1 rounded">user:1234</span></p>
        </div>
    `;
    
    if (suggestions.length > 0) {
        showOtherProducts(suggestions);
    }
}

function hideOtherProducts() {
    const otherSection = document.getElementById('otherProductsSection');
    if (otherSection) {
        otherSection.remove();
    }
}

function goHome() {
    currentCategory = 'all';
    document.getElementById('searchInput').value = '';
    document.getElementById('mobileSearchInput').value = '';
    
    // Reset category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    document.querySelector('[data-category="all"]').classList.remove('bg-gray-200', 'text-gray-700');
    document.querySelector('[data-category="all"]').classList.add('bg-blue-600', 'text-white');
    
    filterProducts();
}

// Dynamic Filter Functions
function quickSearch(query) {
    document.getElementById('searchInput').value = query;
    document.getElementById('mobileSearchInput').value = query;
    performAdvancedSearch(query);
}

function clearAllFilters() {
    // Reset all filters
    document.getElementById('searchInput').value = '';
    document.getElementById('mobileSearchInput').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('sortFilter').value = '';
    document.getElementById('userFilter').value = '';
    
    // Reset category to all
    currentCategory = 'all';
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    document.querySelector('[data-category="all"]').classList.remove('bg-gray-200', 'text-gray-700');
    document.querySelector('[data-category="all"]').classList.add('bg-blue-600', 'text-white');
    
    // Reset products
    filteredProducts = [...allProducts];
    displayProducts();
    hideOtherProducts();
}

function applyFiltersAndSort() {
    let products = [...allProducts];
    
    // Apply category filter
    if (currentCategory !== 'all') {
        products = products.filter(product => product.category === currentCategory);
    }
    
    // Apply price filter
    const priceFilter = document.getElementById('priceFilter').value;
    if (priceFilter) {
        if (priceFilter === '5000+') {
            products = products.filter(product => product.price >= 5000);
        } else {
            const [min, max] = priceFilter.split('-').map(Number);
            products = products.filter(product => product.price >= min && product.price <= max);
        }
    }
    
    // Apply user filter
    const userFilter = document.getElementById('userFilter').value;
    if (userFilter) {
        products = products.filter(product => product.createdBy && product.createdBy.toString() === userFilter);
    }
    
    // Apply sorting
    const sortFilter = document.getElementById('sortFilter').value;
    switch (sortFilter) {
        case 'price-low':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'name-az':
            products.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-za':
            products.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'rating-high':
            products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'newest':
            products.sort((a, b) => {
                const aTime = a.createdAt ? a.createdAt.toMillis() : 0;
                const bTime = b.createdAt ? b.createdAt.toMillis() : 0;
                return bTime - aTime;
            });
            break;
    }
    
    filteredProducts = products;
    displayProducts();
    hideOtherProducts();
}

// Add real-time search with debounce for search inputs
const debouncedSearch = debounce(function(query) {
    if (query.trim()) {
        performAdvancedSearch(query.trim().toLowerCase());
    } else {
        applyFiltersAndSort();
    }
}, 300);

// Category Filter Functions
document.addEventListener('DOMContentLoaded', function() {
    // Category filter event listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            currentCategory = category;
            
            // Update button styles
            document.querySelectorAll('.category-btn').forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            
            this.classList.remove('bg-gray-200', 'text-gray-700');
            this.classList.add('bg-blue-600', 'text-white');
            
            applyFiltersAndSort();
        });
    });
    
    // Filter change event listeners
    document.getElementById('priceFilter').addEventListener('change', applyFiltersAndSort);
    document.getElementById('sortFilter').addEventListener('change', applyFiltersAndSort);
    
    
    // Real-time search listeners
    document.getElementById('searchInput').addEventListener('input', function(e) {
        debouncedSearch(e.target.value);
    });
    
    document.getElementById('mobileSearchInput').addEventListener('input', function(e) {
        // Sync both search inputs
        document.getElementById('searchInput').value = e.target.value;
        debouncedSearch(e.target.value);
    });
    
    // Initialize the app
    updateCartUI();
    loadProducts();
});

// Modal backdrop click handlers
document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAuthModal();
    }
});

document.getElementById('uploadModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeUploadModal();
    }
});

document.getElementById('productModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeProductModal();
    }
});

document.getElementById('cartModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCartModal();
    }
});


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function applyPriorityAndRandomOrder(products) {
    const prioritized = [];
    const remaining = [];

    products.forEach(p => {
        if ((p.name && p.name.toLowerCase().includes("premium")) ||
            (p.link && p.link.toLowerCase().includes("top"))) {
            prioritized.push(p);
        } else {
            remaining.push(p);
        }
    });

    return [...prioritized, ...shuffle(remaining)];
}



    function toggleDefinition(el) {

      el.classList.toggle('active');

    }
     


















    

  





